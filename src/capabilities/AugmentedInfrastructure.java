// src/capabilities/AugmentedInfrastructure.java
// AugmentedInfrastructure
// High-level orchestration and scoring engine for "augmented infrastructure":
// - Omniscient: telemetry, logs, metrics coverage
// - User-centric: latency, satisfaction, UX hints
// - Proactive: maintenance & incident readiness
// - Prolific: utilization, multi-use patterns, revenue streams
// - Personalised: per-tenant/service tailoring
// Ready to sit in front of Java microservices / IaC scripts.

package capabilities;

import java.util.*;

public class AugmentedInfrastructure {

    public enum Dimension {
        OMNISCIENT,
        USER_CENTRIC,
        PROACTIVE,
        PROLIFIC,
        PERSONALISED
    }

    public static final class InfraSnapshot {
        public final double telemetryCoverage;      // 0–1: share of services with metrics/logs/traces
        public final double avgLatencyMs;          // p95 latency
        public final double uptimePercentage;      // overall uptime
        public final double maintenanceAutomation; // 0–1: % tasks automated
        public final double utilizationRate;       // 0–1: resource utilization
        public final int    revenueStreams;        // number of distinct infra-backed services
        public final double perTenantCustomization;// 0–1: degree of per-tenant policies/config
        public final double incidentMTTRHours;     // mean time to recovery

        public InfraSnapshot(
                double telemetryCoverage,
                double avgLatencyMs,
                double uptimePercentage,
                double maintenanceAutomation,
                double utilizationRate,
                int revenueStreams,
                double perTenantCustomization,
                double incidentMTTRHours
        ) {
            this.telemetryCoverage = telemetryCoverage;
            this.avgLatencyMs = avgLatencyMs;
            this.uptimePercentage = uptimePercentage;
            this.maintenanceAutomation = maintenanceAutomation;
            this.utilizationRate = utilizationRate;
            this.revenueStreams = revenueStreams;
            this.perTenantCustomization = perTenantCustomization;
            this.incidentMTTRHours = incidentMTTRHours;
        }
    }

    public static final class DimensionScore {
        public final Dimension dimension;
        public final double score; // 0–1
        public final List<String> recommendations;

        public DimensionScore(Dimension dimension, double score, List<String> recommendations) {
            this.dimension = dimension;
            this.score = score;
            this.recommendations = recommendations;
        }
    }

    public static final class Assessment {
        public final Map<Dimension, DimensionScore> scores;
        public final double overallScore;
        public final List<String> globalRecommendations;

        public Assessment(Map<Dimension, DimensionScore> scores,
                          double overallScore,
                          List<String> globalRecommendations) {
            this.scores = scores;
            this.overallScore = overallScore;
            this.globalRecommendations = globalRecommendations;
        }
    }

    public Assessment assess(InfraSnapshot snapshot) {
        DimensionScore omniscient = scoreOmniscient(snapshot);
        DimensionScore userCentric = scoreUserCentric(snapshot);
        DimensionScore proactive = scoreProactive(snapshot);
        DimensionScore prolific = scoreProlific(snapshot);
        DimensionScore personalised = scorePersonalised(snapshot);

        Map<Dimension, DimensionScore> map = new EnumMap<>(Dimension.class);
        map.put(omniscient.dimension, omniscient);
        map.put(userCentric.dimension, userCentric);
        map.put(proactive.dimension, proactive);
        map.put(prolific.dimension, prolific);
        map.put(personalised.dimension, personalised);

        double overall = (
                omniscient.score +
                userCentric.score +
                proactive.score +
                prolific.score +
                personalised.score
        ) / 5.0;

        List<String> globalRecs = new ArrayList<>();
        if (overall < 0.5) {
            globalRecs.add("Infrastructure is in early augmented stage; prioritize observability and automation.");
        } else if (overall < 0.8) {
            globalRecs.add("Augmented capabilities are emerging; focus on user-centric routing and predictive maintenance.");
        } else {
            globalRecs.add("Infrastructure is strongly augmented; invest in new revenue use-cases and deeper personalization.");
        }

        return new Assessment(map, round2(overall), globalRecs);
    }

    private DimensionScore scoreOmniscient(InfraSnapshot s) {
        double telem = clamp01(s.telemetryCoverage);
        double uptimeNorm = clamp01((s.uptimePercentage - 95.0) / 5.0);
        double score = clamp01(0.6 * telem + 0.4 * uptimeNorm);

        List<String> recs = new ArrayList<>();
        if (telem < 0.8) {
            recs.add("Increase metrics/logs/traces coverage toward 90–100% of critical services.");
        }
        if (uptimeNorm < 0.8) {
            recs.add("Target ≥99.5% uptime by hardening critical path services and dependencies.");
        }
        if (recs.isEmpty()) {
            recs.add("Observability and availability look strong; refine SLOs and anomaly detection.");
        }

        return new DimensionScore(Dimension.OMNISCIENT, round2(score), recs);
    }

    private DimensionScore scoreUserCentric(InfraSnapshot s) {
        double latencyNorm = 1.0 - clamp01((s.avgLatencyMs - 50.0) / 200.0);
        double uptimeNorm = clamp01((s.uptimePercentage - 97.0) / 3.0);
        double score = clamp01(0.7 * latencyNorm + 0.3 * uptimeNorm);

        List<String> recs = new ArrayList<>();
        if (latencyNorm < 0.8) {
            recs.add("Reduce p95 latency via caching, edge deployment, and microservice hotspot profiling.");
        }
        if (uptimeNorm < 0.8) {
            recs.add("Improve user-facing SLOs with redundancy and rate-limiting at the edge.");
        }
        if (recs.isEmpty()) {
            recs.add("User-facing performance is strong; explore adaptive routing per geography/tenant.");
        }

        return new DimensionScore(Dimension.USER_CENTRIC, round2(score), recs);
    }

    private DimensionScore scoreProactive(InfraSnapshot s) {
        double maint = clamp01(s.maintenanceAutomation);
        double mttrNorm = 1.0 - clamp01((s.incidentMTTRHours - 0.5) / 8.0);
        double score = clamp01(0.6 * maint + 0.4 * mttrNorm);

        List<String> recs = new ArrayList<>();
        if (maint < 0.7) {
            recs.add("Automate more maintenance tasks (backups, cert rotation, patching) via runbooks and pipelines.");
        }
        if (mttrNorm < 0.7) {
            recs.add("Reduce MTTR with better alerting, on-call rotation, and pre-defined mitigation playbooks.");
        }
        if (recs.isEmpty()) {
            recs.add("Proactive posture is solid; invest in predictive models for failures and capacity.");
        }

        return new DimensionScore(Dimension.PROACTIVE, round2(score), recs);
    }

    private DimensionScore scoreProlific(InfraSnapshot s) {
        double util = clamp01(s.utilizationRate);
        double streamsNorm = clamp01((s.revenueStreams - 1) / 5.0);
        double score = clamp01(0.5 * util + 0.5 * streamsNorm);

        List<String> recs = new ArrayList<>();
        if (util < 0.4) {
            recs.add("Utilization is low; consolidate workloads or add new services to existing clusters.");
        }
        if (streamsNorm < 0.6) {
            recs.add("Explore additional services or tenants leveraging existing infrastructure capabilities.");
        }
        if (recs.isEmpty()) {
            recs.add("Infrastructure is used intensively; monitor capacity and cost efficiency closely.");
        }

        return new DimensionScore(Dimension.PROLIFIC, round2(score), recs);
    }

    private DimensionScore scorePersonalised(InfraSnapshot s) {
        double cust = clamp01(s.perTenantCustomization);
        double score = cust;

        List<String> recs = new ArrayList<>();
        if (cust < 0.3) {
            recs.add("Introduce basic per-tenant policies (quotas, rate limits, configs) for key services.");
        } else if (cust < 0.7) {
            recs.add("Expand tenant-level configuration and SLAs, including feature flags and routing rules.");
        } else {
            recs.add("Personalization is advanced; consider per-tenant analytics and AI-based scaling policies.");
        }

        return new DimensionScore(Dimension.PERSONALISED, round2(score), recs);
    }

    private static double clamp01(double v) {
        if (v < 0.0) return 0.0;
        if (v > 1.0) return 1.0;
        return v;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public static void main(String[] args) {
        AugmentedInfrastructure engine = new AugmentedInfrastructure();
        InfraSnapshot snap = new InfraSnapshot(
                0.75,  // telemetryCoverage
                120.0, // avgLatencyMs
                98.5,  // uptimePercentage
                0.6,   // maintenanceAutomation
                0.55,  // utilizationRate
                3,     // revenueStreams
                0.4,   // perTenantCustomization
                3.0    // incidentMTTRHours
        );

        Assessment a = engine.assess(snap);
        System.out.println("Overall augmented score: " + a.overallScore);
        for (Dimension d : Dimension.values()) {
            DimensionScore ds = a.scores.get(d);
            System.out.println(d + " -> " + ds.score);
            ds.recommendations.forEach(r -> System.out.println("  - " + r));
        }
        System.out.println("Global recommendations:");
        a.globalRecommendations.forEach(r -> System.out.println("- " + r));
    }
}
