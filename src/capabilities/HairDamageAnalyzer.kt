// src/capabilities/HairDamageAnalyzer.kt
// HairDamageAnalyzer
// Kotlin capability to score hair damage based on cuticle and shaft features.
// Inspired by AI/SEM-based hair damage diagnosis and cuticle-analysis services:
// - Features: cuticle lift, crack density, porosity proxy, roughness index.
// - Output: damage level + numeric score + care recommendations.

package capabilities

import kotlin.math.max
import kotlin.math.min
import kotlin.math.round

data class HairFeatures(
    val cuticleLiftRatio: Double,      // 0–1; fraction of cuticles showing lifting/irregular overlay
    val crackHoleRatio: Double,        // 0–1; fraction with cracks/holes
    val exposedCortexRatio: Double,    // 0–1; fraction with cortex exposure / missing cuticle
    val roughnessIndex: Double,        // 0–1; surface texture proxy
    val porosityIndex: Double,         // 0–1; higher = more porous/dry
    val colorOxidationIndex: Double    // 0–1; higher = more oxidation / chemical processing
)

enum class HairDamageLevel {
    HEALTHY,
    WEAK_DAMAGE,
    DAMAGE,
    HIGH_DAMAGE
}

data class HairDamageResult(
    val level: HairDamageLevel,
    val score: Double,                 // 0–1 overall damage score
    val indicators: Map<String, Double>,
    val recommendations: List<String>
)

object HairDamageAnalyzer {

    fun analyze(features: HairFeatures): HairDamageResult {
        val liftScore = clamp01(features.cuticleLiftRatio)
        val crackScore = clamp01(features.crackHoleRatio)
        val cortexScore = clamp01(features.exposedCortexRatio)
        val roughScore = clamp01(features.roughnessIndex)
        val porosityScore = clamp01(features.porosityIndex)
        val oxidationScore = clamp01(features.colorOxidationIndex)

        val structuralDamage = 0.4 * liftScore +
                0.3 * crackScore +
                0.3 * cortexScore

        val surfaceDamage = 0.4 * roughScore +
                0.4 * porosityScore +
                0.2 * oxidationScore

        val overall = clamp01(0.6 * structuralDamage + 0.4 * surfaceDamage)
        val level = when {
            overall < 0.2 -> HairDamageLevel.HEALTHY
            overall < 0.4 -> HairDamageLevel.WEAK_DAMAGE
            overall < 0.7 -> HairDamageLevel.DAMAGE
            else -> HairDamageLevel.HIGH_DAMAGE
        }

        val recs = buildRecommendations(level, porosityScore, oxidationScore, cortexScore)

        return HairDamageResult(
            level = level,
            score = round2(overall),
            indicators = mapOf(
                "structuralDamage" to round2(structuralDamage),
                "surfaceDamage" to round2(surfaceDamage),
                "cuticleLiftRatio" to round2(liftScore),
                "crackHoleRatio" to round2(crackScore),
                "exposedCortexRatio" to round2(cortexScore),
                "porosityIndex" to round2(porosityScore),
                "colorOxidationIndex" to round2(oxidationScore)
            ),
            recommendations = recs
        )
    }

    private fun buildRecommendations(
        level: HairDamageLevel,
        porosityScore: Double,
        oxidationScore: Double,
        cortexScore: Double
    ): List<String> {
        val recs = mutableListOf<String>()

        when (level) {
            HairDamageLevel.HEALTHY -> {
                recs += "Hair structure appears healthy; maintain current routine with gentle cleansing and UV/heat protection."
                if (oxidationScore > 0.4) {
                    recs += "Limit additional bleaching or high-lift color to preserve current cuticle integrity."
                }
            }
            HairDamageLevel.WEAK_DAMAGE -> {
                recs += "Early cuticle lifting detected; introduce weekly bond-building or protein-balancing treatments."
                if (porosityScore > 0.5) {
                    recs += "Add lightweight hydrating masks and leave-in conditioners to reduce moisture loss."
                }
            }
            HairDamageLevel.DAMAGE -> {
                recs += "Structural damage visible; reduce heat styling and spacing between chemical services."
                recs += "Increase bond-repair and protein treatments, followed by emollient conditioners to avoid brittleness."
                if (oxidationScore > 0.5) {
                    recs += "Pause strong bleaching/oxidative color until structural indicators improve."
                }
            }
            HairDamageLevel.HIGH_DAMAGE -> {
                recs += "Severe cuticle disruption and cortex exposure detected; prioritize trims to remove highly damaged lengths."
                recs += "Adopt intensive repair protocols (bond-building, protein + moisture) and minimize mechanical/heat stress."
                if (cortexScore > 0.4) {
                    recs += "Consult a professional stylist or dermatologist before further chemical treatments."
                }
            }
        }

        return recs
    }

    private fun clamp01(v: Double): Double = max(0.0, min(1.0, v))

    private fun round2(v: Double): Double = round(v * 100.0) / 100.0
}

fun main() {
    val sample = HairFeatures(
        cuticleLiftRatio = 0.35,
        crackHoleRatio = 0.25,
        exposedCortexRatio = 0.1,
        roughnessIndex = 0.4,
        porosityIndex = 0.55,
        colorOxidationIndex = 0.5
    )

    val result = HairDamageAnalyzer.analyze(sample)
    println("Damage level: ${result.level}")
    println("Score: ${result.score}")
    println("Indicators: ${result.indicators}")
    println("Recommendations:")
    result.recommendations.forEach { println("- $it") }
}
