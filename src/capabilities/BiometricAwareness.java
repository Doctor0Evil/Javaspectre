// src/capabilities/BiometricAwareness.java
// BiometricAwareness
// Lightweight biometric stress / awareness estimator for AI workstations.
// Uses simplified HRV-inspired inputs (heart rate, RMSSD-like variance, motion flags)
// to compute a Biometric Awareness Index (BAI) and stress state with recommendations.
// Designed to integrate with Javaspectre's AIWorkstationOptimizer and XR frontends.

package capabilities;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BiometricAwareness {

    public static final class Sample {
        public final long timestampMs;
        public final int heartRateBpm;
        public final double hrvProxy;       // e.g., RMSSD-like measure in ms
        public final boolean highMotion;    // from accelerometer / vision
        public final boolean lateNight;     // context flag

        public Sample(long timestampMs,
                      int heartRateBpm,
                      double hrvProxy,
                      boolean highMotion,
                      boolean lateNight) {
            this.timestampMs = timestampMs;
            this.heartRateBpm = heartRateBpm;
            this.hrvProxy = hrvProxy;
            this.highMotion = highMotion;
            this.lateNight = lateNight;
        }
    }

    public enum StressLevel {
        LOW, MEDIUM, HIGH
    }

    public static final class Metrics {
        public final double avgHeartRate;
        public final double avgHrvProxy;
        public final double motionRatio;
        public final double bai;           // Biometric Awareness Index 0–1
        public final StressLevel stress;
        public final List<String> recommendations;

        public Metrics(double avgHeartRate,
                       double avgHrvProxy,
                       double motionRatio,
                       double bai,
                       StressLevel stress,
                       List<String> recommendations) {
            this.avgHeartRate = avgHeartRate;
            this.avgHrvProxy = avgHrvProxy;
            this.motionRatio = motionRatio;
            this.bai = bai;
            this.stress = stress;
            this.recommendations = recommendations;
        }
    }

    private final List<Sample> window = new ArrayList<>();
    private final int maxWindowSize;

    public BiometricAwareness(int maxWindowSize) {
        this.maxWindowSize = Math.max(10, maxWindowSize);
    }

    public BiometricAwareness() {
        this(300);
    }

    public void addSample(Sample sample) {
        window.add(sample);
        if (window.size() > maxWindowSize) {
            int trim = window.size() - maxWindowSize;
            for (int i = 0; i < trim; i++) {
                window.remove(0);
            }
        }
    }

    public Metrics computeMetrics() {
        if (window.isEmpty()) {
            return new Metrics(0, 0, 0, 0, StressLevel.LOW,
                    Collections.singletonList("No biometric data yet; continue regular work rhythm and periodic breaks."));
        }

        int n = window.size();
        double sumHr = 0;
        double sumHrv = 0;
        int motionCount = 0;
        int lateNightCount = 0;

        for (Sample s : window) {
            sumHr += s.heartRateBpm;
            sumHrv += s.hrvProxy;
            if (s.highMotion) motionCount++;
            if (s.lateNight) lateNightCount++;
        }

        double avgHr = sumHr / n;
        double avgHrv = sumHrv / n;
        double motionRatio = (double) motionCount / n;
        double lateNightRatio = (double) lateNightCount / n;

        double hrNorm = normalize(avgHr, 60, 95);
        double hrvNorm = 1.0 - normalize(avgHrv, 20, 80);
        double motionNorm = motionRatio;

        double bai = clamp01(
                0.5 * hrNorm +
                0.35 * hrvNorm +
                0.15 * motionNorm
        );

        StressLevel stressLevel;
        if (bai < 0.35) stressLevel = StressLevel.LOW;
        else if (bai < 0.7) stressLevel = StressLevel.MEDIUM;
        else stressLevel = StressLevel.HIGH;

        List<String> recs = new ArrayList<>();
        if (stressLevel == StressLevel.LOW) {
            recs.add("Biometric load is low; maintain current cadence and standard 45–60 minute micro-breaks.");
            if (lateNightRatio > 0.3) {
                recs.add("Even with low stress, consider earlier shutdowns to protect circadian rhythm.");
            }
        } else if (stressLevel == StressLevel.MEDIUM) {
            recs.add("Moderate stress detected; schedule a 5–10 minute break within the next 30 minutes.");
            recs.add("Run a short breathing exercise (4–6 breaths per minute for 2–3 minutes).");
            if (motionRatio < 0.2) {
                recs.add("Low movement: stand, stretch, or walk briefly to reset posture and circulation.");
            }
        } else {
            recs.add("High stress detected: pause high-cognitive tasks for 10–15 minutes if possible.");
            recs.add("Consider reducing concurrent workloads (fewer experiments or services) temporarily.");
            if (lateNightRatio > 0.2) {
                recs.add("Late-night high stress: strongly consider stopping intense work to avoid chronic overload.");
            }
        }

        return new Metrics(
                round2(avgHr),
                round2(avgHrv),
                round2(motionRatio),
                round2(bai),
                stressLevel,
                recs
        );
    }

    private static double normalize(double value, double low, double high) {
        if (high <= low) return 0.0;
        double clamped = Math.max(low, Math.min(high, value));
        return (clamped - low) / (high - low);
    }

    private static double clamp01(double v) {
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    // Simple demo harness
    public static void main(String[] args) throws InterruptedException {
        BiometricAwareness awareness = new BiometricAwareness(120);

        long t0 = System.currentTimeMillis();
        for (int i = 0; i < 60; i++) {
            long ts = t0 + i * 1000L;
            int hr = 68 + (int) (5 * Math.sin(i / 10.0));
            double hrv = 55 + 10 * Math.cos(i / 12.0);
            boolean motion = (i % 15) < 3;
            boolean lateNight = false;

            awareness.addSample(new Sample(ts, hr, hrv, motion, lateNight));
        }

        Metrics m = awareness.computeMetrics();
        System.out.println("Avg HR: " + m.avgHeartRate + " bpm");
        System.out.println("Avg HRV proxy: " + m.avgHrvProxy + " ms");
        System.out.println("Motion ratio: " + m.motionRatio);
        System.out.println("BAI: " + m.bai);
        System.out.println("Stress level: " + m.stress);
        System.out.println("Recommendations:");
        for (String r : m.recommendations) {
            System.out.println("- " + r);
        }
    }
}
