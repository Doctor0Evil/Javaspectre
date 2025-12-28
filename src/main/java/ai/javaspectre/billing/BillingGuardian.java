// Path: src/main/java/ai/javaspectre/billing/BillingGuardian.java
package ai.javaspectre.billing;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;

/**
 * Javaspectre BillingGuardian
 *
 * A defensive Java module to prevent billing issues, repeated payment declines,
 * and GitHub-style account lockouts and CI shutdowns.
 *
 * Core ideas (aligned with GitHub billing docs and community patterns):
 * - Detect streaks of declined payments and flag HIGH/CRITICAL risk early. [web:56][web:77][web:54][web:55][web:80]
 * - Monitor budgets and utilization for metered products (Actions, Codespaces, premium requests). [web:60][web:63]
 * - Emit concrete, prioritized remediation actions before the platform blocks usage. [web:56][web:60][web:80]
 *
 * This module is intentionally framework-agnostic: no logging framework, no HTTP client.
 * You can plug it into Spring, Quarkus, Micronaut, CLI tools, schedulers, or a desktop
 * tray agent that watches exported JSON from GitHub.
 */
public final class BillingGuardian {

    // ---------- ENUMS ----------

    public enum PaymentStatus {
        SUCCESS,
        DECLINED
    }

    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum ProductType {
        ACTIONS,
        CODESPACES,
        COPILOT_PREMIUM,
        PACKAGES
    }

    public enum RecommendationTag {
        UPDATE_PAYMENT_METHOD,
        CONTACT_BANK,
        ADJUST_BUDGETS,
        REDUCE_USAGE,
        ENABLE_ALERTS,
        CONTACT_PLATFORM_SUPPORT,
        REVIEW_MULTIPLE_ACCOUNTS,
        RECHECK_IN_24H,
        MIGRATE_TO_SELF_HOSTED,
        SPLIT_PUBLIC_PRIVATE_WORKLOADS
    }

    // ---------- VALUE OBJECTS ----------

    public static final class PaymentEvent {
        private final String id;
        private final LocalDate date;
        private final String method;
        private final double amountUsd;
        private final PaymentStatus status;

        public PaymentEvent(String id,
                            LocalDate date,
                            String method,
                            double amountUsd,
                            PaymentStatus status) {
            this.id = Objects.requireNonNull(id, "id");
            this.date = Objects.requireNonNull(date, "date");
            this.method = Objects.requireNonNull(method, "method");
            this.amountUsd = amountUsd;
            this.status = Objects.requireNonNull(status, "status");
        }

        public String getId() {
            return id;
        }

        public LocalDate getDate() {
            return date;
        }

        public String getMethod() {
            return method;
        }

        public double getAmountUsd() {
            return amountUsd;
        }

        public PaymentStatus getStatus() {
            return status;
        }

        @Override
        public String toString() {
            return "PaymentEvent{" +
                    "id='" + id + '\'' +
                    ", date=" + date +
                    ", method='" + method + '\'' +
                    ", amountUsd=" + amountUsd +
                    ", status=" + status +
                    '}';
        }
    }

    public static final class ProductUsage {
        private final ProductType productType;
        private final double grossUsd;     // metered raw usage
        private final double discountsUsd; // discounts / free tier
        private final double budgetUsd;    // configured budget (0 = no budget)
        private final double spentUsd;     // actual billable usage
        private final Double includedUnits; // e.g. minutes, core-hours, requests
        private final Double usedUnits;     // same units as includedUnits

        public ProductUsage(ProductType productType,
                            double grossUsd,
                            double discountsUsd,
                            double budgetUsd,
                            double spentUsd,
                            Double includedUnits,
                            Double usedUnits) {
            this.productType = Objects.requireNonNull(productType, "productType");
            this.grossUsd = grossUsd;
            this.discountsUsd = discountsUsd;
            this.budgetUsd = budgetUsd;
            this.spentUsd = spentUsd;
            this.includedUnits = includedUnits;
            this.usedUnits = usedUnits;
        }

        public ProductType getProductType() {
            return productType;
        }

        public double getGrossUsd() {
            return grossUsd;
        }

        public double getDiscountsUsd() {
            return discountsUsd;
        }

        public double getBudgetUsd() {
            return budgetUsd;
        }

        public double getSpentUsd() {
            return spentUsd;
        }

        public Double getIncludedUnits() {
            return includedUnits;
        }

        public Double getUsedUnits() {
            return usedUnits;
        }

        @Override
        public String toString() {
            return "ProductUsage{" +
                    "productType=" + productType +
                    ", grossUsd=" + grossUsd +
                    ", discountsUsd=" + discountsUsd +
                    ", budgetUsd=" + budgetUsd +
                    ", spentUsd=" + spentUsd +
                    ", includedUnits=" + includedUnits +
                    ", usedUnits=" + usedUnits +
                    '}';
        }
    }

    public static final class AccountFlags {
        private final boolean hasUnpaidInvoices;
        private final boolean hasLockBanner;
        private final boolean twoFaRequired;
        private final boolean emailUnverified;

        public AccountFlags(boolean hasUnpaidInvoices,
                            boolean hasLockBanner,
                            boolean twoFaRequired,
                            boolean emailUnverified) {
            this.hasUnpaidInvoices = hasUnpaidInvoices;
            this.hasLockBanner = hasLockBanner;
            this.twoFaRequired = twoFaRequired;
            this.emailUnverified = emailUnverified;
        }

        public boolean hasUnpaidInvoices() {
            return hasUnpaidInvoices;
        }

        public boolean hasLockBanner() {
            return hasLockBanner;
        }

        public boolean isTwoFaRequired() {
            return twoFaRequired;
        }

        public boolean isEmailUnverified() {
            return emailUnverified;
        }

        @Override
        public String toString() {
            return "AccountFlags{" +
                    "hasUnpaidInvoices=" + hasUnpaidInvoices +
                    ", hasLockBanner=" + hasLockBanner +
                    ", twoFaRequired=" + twoFaRequired +
                    ", emailUnverified=" + emailUnverified +
                    '}';
        }
    }

    public static final class Recommendation {
        private final String message;
        private final EnumSet<RecommendationTag> tags;

        public Recommendation(String message, EnumSet<RecommendationTag> tags) {
            this.message = Objects.requireNonNull(message, "message");
            this.tags = tags == null ? EnumSet.noneOf(RecommendationTag.class) : tags.clone();
        }

        public String getMessage() {
            return message;
        }

        public EnumSet<RecommendationTag> getTags() {
            return tags.clone();
        }

        @Override
        public String toString() {
            return "Recommendation{" +
                    "message='" + message + '\'' +
                    ", tags=" + tags +
                    '}';
        }
    }

    public static final class AnalysisResult {
        private final Instant generatedAt;
        private final RiskLevel riskLevel;
        private final PaymentSummary paymentSummary;
        private final UsageSummary usageSummary;
        private final AccountFlags accountFlags;
        private final List<Recommendation> recommendations;

        public AnalysisResult(Instant generatedAt,
                              RiskLevel riskLevel,
                              PaymentSummary paymentSummary,
                              UsageSummary usageSummary,
                              AccountFlags accountFlags,
                              List<Recommendation> recommendations) {
            this.generatedAt = Objects.requireNonNull(generatedAt, "generatedAt");
            this.riskLevel = Objects.requireNonNull(riskLevel, "riskLevel");
            this.paymentSummary = Objects.requireNonNull(paymentSummary, "paymentSummary");
            this.usageSummary = Objects.requireNonNull(usageSummary, "usageSummary");
            this.accountFlags = Objects.requireNonNull(accountFlags, "accountFlags");
            this.recommendations = Collections.unmodifiableList(
                    new ArrayList<>(Objects.requireNonNull(recommendations, "recommendations")));
        }

        public Instant getGeneratedAt() {
            return generatedAt;
        }

        public RiskLevel getRiskLevel() {
            return riskLevel;
        }

        public PaymentSummary getPaymentSummary() {
            return paymentSummary;
        }

        public UsageSummary getUsageSummary() {
            return usageSummary;
        }

        public AccountFlags getAccountFlags() {
            return accountFlags;
        }

        public List<Recommendation> getRecommendations() {
            return recommendations;
        }

        @Override
        public String toString() {
            return "AnalysisResult{" +
                    "generatedAt=" + generatedAt +
                    ", riskLevel=" + riskLevel +
                    ", paymentSummary=" + paymentSummary +
                    ", usageSummary=" + usageSummary +
                    ", accountFlags=" + accountFlags +
                    ", recommendations=" + recommendations +
                    '}';
        }
    }

    public static final class PaymentSummary {
        private final int totalEvents;
        private final int consecutiveDeclines;
        private final PaymentEvent lastPayment;
        private final PaymentEvent lastSuccess;
        private final PaymentEvent lastDecline;

        public PaymentSummary(int totalEvents,
                              int consecutiveDeclines,
                              PaymentEvent lastPayment,
                              PaymentEvent lastSuccess,
                              PaymentEvent lastDecline) {
            this.totalEvents = totalEvents;
            this.consecutiveDeclines = consecutiveDeclines;
            this.lastPayment = lastPayment;
            this.lastSuccess = lastSuccess;
            this.lastDecline = lastDecline;
        }

        public int getTotalEvents() {
            return totalEvents;
        }

        public int getConsecutiveDeclines() {
          return consecutiveDeclines;
        }

        public PaymentEvent getLastPayment() {
            return lastPayment;
        }

        public PaymentEvent getLastSuccess() {
            return lastSuccess;
        }

        public PaymentEvent getLastDecline() {
            return lastDecline;
        }

        @Override
        public String toString() {
            return "PaymentSummary{" +
                    "totalEvents=" + totalEvents +
                    ", consecutiveDeclines=" + consecutiveDeclines +
                    ", lastPayment=" + lastPayment +
                    ", lastSuccess=" + lastSuccess +
                    ", lastDecline=" + lastDecline +
                    '}';
        }
    }

    public static final class UsageSummary {
        private final List<ProductUsage> products;
        private final List<ProductRisk> productRisks;

        public UsageSummary(List<ProductUsage> products,
                            List<ProductRisk> productRisks) {
            this.products = Collections.unmodifiableList(new ArrayList<>(products));
            this.productRisks = Collections.unmodifiableList(new ArrayList<>(productRisks));
        }

        public List<ProductUsage> getProducts() {
            return products;
        }

        public List<ProductRisk> getProductRisks() {
            return productRisks;
        }

        @Override
        public String toString() {
            return "UsageSummary{" +
                    "products=" + products +
                    ", productRisks=" + productRisks +
                    '}';
        }
    }

    public static final class ProductRisk {
        private final ProductType productType;
        private final double utilizationBudget;      // 0..1 relative to budget
        private final double utilizationIncluded;    // 0..1 relative to included units
        private final boolean nearBudget;
        private final boolean overBudget;
        private final boolean nearIncluded;
        private final boolean overIncluded;

        public ProductRisk(ProductType productType,
                           double utilizationBudget,
                           double utilizationIncluded,
                           boolean nearBudget,
                           boolean overBudget,
                           boolean nearIncluded,
                           boolean overIncluded) {
            this.productType = Objects.requireNonNull(productType, "productType");
            this.utilizationBudget = utilizationBudget;
            this.utilizationIncluded = utilizationIncluded;
            this.nearBudget = nearBudget;
            this.overBudget = overBudget;
            this.nearIncluded = nearIncluded;
            this.overIncluded = overIncluded;
        }

        public ProductType getProductType() {
            return productType;
        }

        public double getUtilizationBudget() {
            return utilizationBudget;
        }

        public double getUtilizationIncluded() {
            return utilizationIncluded;
        }

        public boolean isNearBudget() {
            return nearBudget;
        }

        public boolean isOverBudget() {
            return overBudget;
        }

        public boolean isNearIncluded() {
            return nearIncluded;
        }

        public boolean isOverIncluded() {
            return overIncluded;
        }

        @Override
        public String toString() {
            return "ProductRisk{" +
                    "productType=" + productType +
                    ", utilizationBudget=" + utilizationBudget +
                    ", utilizationIncluded=" + utilizationIncluded +
                    ", nearBudget=" + nearBudget +
                    ", overBudget=" + overBudget +
                    ", nearIncluded=" + nearIncluded +
                    ", overIncluded=" + overIncluded +
                    '}';
        }
    }

    // ---------- CONFIGURATION ----------

    private final int consecutiveDeclineThreshold;
    private final double warnUtilization;
    private final double highUtilization;

    public BillingGuardian() {
        this(2, 0.75, 0.90);
    }

    public BillingGuardian(int consecutiveDeclineThreshold,
                           double warnUtilization,
                           double highUtilization) {
        this.consecutiveDeclineThreshold = consecutiveDeclineThreshold;
        this.warnUtilization = warnUtilization;
        this.highUtilization = highUtilization;
    }

    // ---------- PUBLIC API ----------

    public AnalysisResult analyze(List<PaymentEvent> paymentEvents,
                                  List<ProductUsage> productUsages,
                                  AccountFlags accountFlags) {

        List<PaymentEvent> sortedPayments = new ArrayList<>(paymentEvents);
        sortedPayments.sort((a, b) -> b.getDate().compareTo(a.getDate())); // newest first

        PaymentSummary paymentSummary = analyzePayments(sortedPayments);
        UsageSummary usageSummary = analyzeUsage(productUsages);
        RiskLevel riskLevel = computeRisk(paymentSummary, usageSummary, accountFlags);
        List<Recommendation> recs = buildRecommendations(paymentSummary, usageSummary, accountFlags, riskLevel);

        return new AnalysisResult(
                Instant.now(),
                riskLevel,
                paymentSummary,
                usageSummary,
                accountFlags,
                recs
        );
    }

    // ---------- PAYMENT ANALYSIS ----------

    private PaymentSummary analyzePayments(List<PaymentEvent> payments) {
        int total = payments.size();
        int consecutiveDeclines = 0;
        PaymentEvent lastPayment = total > 0 ? payments.get(0) : null;
        PaymentEvent lastSuccess = null;
        PaymentEvent lastDecline = null;

        for (PaymentEvent event : payments) {
            if (event.getStatus() == PaymentStatus.DECLINED) {
                consecutiveDeclines++;
                if (lastDecline == null) {
                    lastDecline = event;
                }
            } else if (event.getStatus() == PaymentStatus.SUCCESS) {
                if (lastSuccess == null) {
                    lastSuccess = event;
                }
                break; // streak ended
            }
        }

        return new PaymentSummary(
                total,
                consecutiveDeclines,
                lastPayment,
                lastSuccess,
                lastDecline
        );
    }

    // ---------- USAGE ANALYSIS ----------

    private UsageSummary analyzeUsage(List<ProductUsage> usages) {
        List<ProductRisk> risks = new ArrayList<>();

        for (ProductUsage usage : usages) {
            double budgetUtil = 0.0;
            if (usage.getBudgetUsd() > 0.0) {
                budgetUtil = usage.getSpentUsd() / usage.getBudgetUsd();
            }

            double includedUtil = 0.0;
            if (usage.getIncludedUnits() != null
                    && usage.getIncludedUnits() > 0.0
                    && usage.getUsedUnits() != null) {
                includedUtil = usage.getUsedUnits() / usage.getIncludedUnits();
            }

            boolean nearBudget = budgetUtil >= warnUtilization && budgetUtil < 1.0;
            boolean overBudget = budgetUtil >= 1.0 && usage.getBudgetUsd() > 0.0;
            boolean nearIncluded = includedUtil >= warnUtilization && includedUtil < 1.0;
            boolean overIncluded = includedUtil >= 1.0 && usage.getIncludedUnits() != null
                    && usage.getIncludedUnits() > 0.0;

            risks.add(new ProductRisk(
                    usage.getProductType(),
                    budgetUtil,
                    includedUtil,
                    nearBudget,
                    overBudget,
                    nearIncluded,
                    overIncluded
            ));
        }

        return new UsageSummary(usages, risks);
    }

    // ---------- RISK COMPUTATION ----------

    private RiskLevel computeRisk(PaymentSummary paymentSummary,
                                  UsageSummary usageSummary,
                                  AccountFlags accountFlags) {

        if (accountFlags.hasLockBanner() || accountFlags.hasUnpaidInvoices()) {
            return RiskLevel.CRITICAL;
        }

        if (paymentSummary.getConsecutiveDeclines() >= consecutiveDeclineThreshold) {
            return RiskLevel.HIGH;
        }

        boolean anyHighUtilization = false;
        boolean anyMediumUtilization = false;

        for (ProductRisk risk : usageSummary.getProductRisks()) {
            if (risk.isOverBudget() || risk.isOverIncluded()) {
                return RiskLevel.HIGH;
            }
            if (risk.isNearBudget() || risk.isNearIncluded()) {
                if (risk.getUtilizationBudget() >= highUtilization
                        || risk.getUtilizationIncluded() >= highUtilization) {
                    anyHighUtilization = true;
                } else {
                    anyMediumUtilization = true;
                }
            }
        }

        if (anyHighUtilization) {
            return RiskLevel.HIGH;
        }

        if (paymentSummary.getConsecutiveDeclines() > 0
                || anyMediumUtilization
                || accountFlags.isTwoFaRequired()
                || accountFlags.isEmailUnverified()) {
            return RiskLevel.MEDIUM;
        }

        return RiskLevel.LOW;
    }

    // ---------- RECOMMENDATIONS ----------

    private List<Recommendation> buildRecommendations(PaymentSummary paymentSummary,
                                                      UsageSummary usageSummary,
                                                      AccountFlags accountFlags,
                                                      RiskLevel overallRisk) {
        List<Recommendation> recs = new ArrayList<>();

        // Account lock / unpaid
        if (accountFlags.hasLockBanner() || accountFlags.hasUnpaidInvoices()) {
            recs.add(new Recommendation(
                    "Open your platform Billing / Payment history view and clear any unpaid invoices immediately; retry failed charges if a 'Retry' or 'Pay now' button is available.",
                    EnumSet.of(RecommendationTag.UPDATE_PAYMENT_METHOD, RecommendationTag.CONTACT_PLATFORM_SUPPORT)
            ));
            recs.add(new Recommendation(
                    "After updating payment details, trigger a manual billing authorization (for example, by renewing the subscription) and wait up to 24 hours for the lock to clear.",
                    EnumSet.of(RecommendationTag.UPDATE_PAYMENT_METHOD, RecommendationTag.RECHECK_IN_24H)
            ));
        }

        // Payment decline streak
        if (paymentSummary.getConsecutiveDeclines() >= consecutiveDeclineThreshold) {
            recs.add(new Recommendation(
                    "Update your primary payment method: verify card number, expiration, CVV, and billing address exactly match bank records, then save a new authorization.",
                    EnumSet.of(RecommendationTag.UPDATE_PAYMENT_METHOD)
            ));
            recs.add(new Recommendation(
                    "Contact your bank or card issuer and request whitelisting of recurring charges from your developer platform vendor to prevent automated fraud blocks.",
                    EnumSet.of(RecommendationTag.CONTACT_BANK)
            ));
            recs.add(new Recommendation(
                    "Temporarily reduce high-cost workloads (e.g., CI for heavy repositories, long Codespaces sessions) until a successful payment is visible in billing history.",
                    EnumSet.of(RecommendationTag.REDUCE_USAGE)
            ));
        } else if (paymentSummary.getConsecutiveDeclines() > 0) {
            recs.add(new Recommendation(
                    "Recent card declines detected; double-check stored card data and ensure sufficient funds or credit limit before the platform escalates to account lock.",
                    EnumSet.of(RecommendationTag.UPDATE_PAYMENT_METHOD, RecommendationTag.RECHECK_IN_24H)
            ));
        }

        // Usage per product
        for (ProductRisk risk : usageSummary.getProductRisks()) {
            ProductType type = risk.getProductType();
            if (risk.isOverBudget() || risk.isOverIncluded()) {
                recs.addAll(overLimitRecommendations(type));
            } else if (risk.isNearBudget() || risk.isNearIncluded()) {
                recs.addAll(nearLimitRecommendations(type));
            }
        }

        // 2FA / email
        if (accountFlags.isTwoFaRequired()) {
            recs.add(new Recommendation(
                    "Complete 2FA setup to avoid being locked out of account and billing views; configure an authenticator app and backup codes.",
                    EnumSet.of(RecommendationTag.CONTACT_PLATFORM_SUPPORT)
            ));
        }
        if (accountFlags.isEmailUnverified()) {
            recs.add(new Recommendation(
                    "Verify your primary email address; unverified email can block some billing and subscription workflows.",
                    EnumSet.of(RecommendationTag.REVIEW_MULTIPLE_ACCOUNTS)
            ));
        }

        // Low-risk baseline
        if (recs.isEmpty() || overallRisk == RiskLevel.LOW) {
            recs.add(new Recommendation(
                    "Configure budgets and threshold alerts (75%, 90%, 100%) for Actions, Codespaces, and premium requests so you receive email and UI warnings before limits are hit.",
                    EnumSet.of(RecommendationTag.ENABLE_ALERTS, RecommendationTag.ADJUST_BUDGETS)
            ));
        }

        return recs;
    }

    private List<Recommendation> overLimitRecommendations(ProductType type) {
        List<Recommendation> recs = new ArrayList<>();
        switch (type) {
            case ACTIONS:
                recs.add(new Recommendation(
                        "GitHub Actions spending has reached or exceeded the configured budget; increase the budget slightly or disable non-critical workflows to avoid job cancellations.",
                        EnumSet.of(RecommendationTag.ADJUST_BUDGETS, RecommendationTag.REDUCE_USAGE)
                ));
                recs.add(new Recommendation(
                        "Migrate heavy CI jobs to self-hosted runners or scheduled nightly runs, and reduce matrix size and OS diversity where possible.",
                        EnumSet.of(RecommendationTag.MIGRATE_TO_SELF_HOSTED, RecommendationTag.REDUCE_USAGE)
                ));
                break;
            case CODESPACES:
                recs.add(new Recommendation(
                        "Codespaces compute or storage usage is above budget; stop idle environments and move long-running development to local or self-managed infrastructure.",
                        EnumSet.of(RecommendationTag.REDUCE_USAGE, RecommendationTag.MIGRATE_TO_SELF_HOSTED)
                ));
                break;
            case COPILOT_PREMIUM:
                recs.add(new Recommendation(
                        "Premium model usage has exhausted the configured budget or included requests; restrict use to critical sessions or increase the premium request budget slightly.",
                        EnumSet.of(RecommendationTag.ADJUST_BUDGETS)
                ));
                break;
            case PACKAGES:
                recs.add(new Recommendation(
                        "Packages storage/egress appears over budget; clean up unused versions and artifacts or raise the storage budget.",
                        EnumSet.of(RecommendationTag.ADJUST_BUDGETS, RecommendationTag.REDUCE_USAGE)
                ));
                break;
            default:
                break;
        }
        return recs;
    }

    private List<Recommendation> nearLimitRecommendations(ProductType type) {
        List<Recommendation> recs = new ArrayList<>();
        switch (type) {
            case ACTIONS:
                recs.add(new Recommendation(
                        "GitHub Actions usage is approaching the monthly budget; prioritize critical workflows and reduce CI frequency for non-essential repositories.",
                        EnumSet.of(RecommendationTag.REDUCE_USAGE)
                ));
                break;
            case CODESPACES:
                recs.add(new Recommendation(
                        "Codespaces usage is nearing your free or budgeted allocation; close inactive instances and move low-priority tasks off Codespaces.",
                        EnumSet.of(RecommendationTag.REDUCE_USAGE)
                ));
                break;
            case COPILOT_PREMIUM:
                recs.add(new Recommendation(
                        "Copilot premium requests are nearing their limit; reserve advanced models for tasks where they provide clear, measurable value.",
                        EnumSet.of(RecommendationTag.REDUCE_USAGE)
                ));
                break;
            case PACKAGES:
                recs.add(new Recommendation(
                        "Packages storage is approaching its cap; audit large artifacts and archive or delete obsolete images and bundles.",
                        EnumSet.of(RecommendationTag.REDUCE_USAGE)
                ));
                break;
            default:
                break;
        }
        return recs;
    }

    // ---------- DEMO: mirrors your December pattern ----------

    /**
     * Quick demo of running the guardian with data similar to your December
     * billing situation (three declines around ~1103.62 USD). [web:56][web:77]
     */
    public static void main(String[] args) {
        BillingGuardian guardian = new BillingGuardian();

        List<PaymentEvent> payments = new ArrayList<>();
        payments.add(new PaymentEvent(
                "0ISVRMYT",
                LocalDate.of(2025, 12, 24),
                "MasterCard ending in 6476",
                1103.62,
                PaymentStatus.DECLINED
        ));
        payments.add(new PaymentEvent(
                "1QGKSPW0",
                LocalDate.of(2025, 12, 17),
                "MasterCard ending in 6476",
                1103.62,
                PaymentStatus.DECLINED
        ));
        payments.add(new PaymentEvent(
                "1GKPPYZ7",
                LocalDate.of(2025, 12, 10),
                "MasterCard ending in 6476",
                1103.62,
                PaymentStatus.DECLINED
        ));
        payments.add(new PaymentEvent(
                "1LC6POQZ",
                LocalDate.of(2025, 11, 13),
                "MasterCard ending in 6476",
                9.82,
                PaymentStatus.SUCCESS
        ));

        List<ProductUsage> usage = new ArrayList<>();
        usage.add(new ProductUsage(
                ProductType.ACTIONS,
                1562.04,   // gross
                550.74,    // discounts
                1000.00,   // budget example
                1011.30,   // spent
                2000.0,    // included minutes
                2000.0     // used minutes
        ));
        usage.add(new ProductUsage(
                ProductType.COPILOT_PREMIUM,
                0.36,
                0.0,
                0.0,
                0.0,
                100.0, // hypothetical included premium requests
                9.0
        ));

        AccountFlags flags = new AccountFlags(
                true,   // hasUnpaidInvoices (implied by repeated declines) [web:56]
                false,  // hasLockBanner (set true if UI shows lock)
                false,  // twoFaRequired
                false   // emailUnverified
        );

        AnalysisResult result = guardian.analyze(payments, usage, flags);

        System.out.println("=== Javaspectre BillingGuardian Report ===");
        System.out.println("Generated at: " + LocalDate.ofInstant(
                result.getGeneratedAt(), ZoneOffset.UTC));
        System.out.println("Risk level  : " + result.getRiskLevel());
        System.out.println("Payment summary: " + result.getPaymentSummary());
        System.out.println("Usage summary  : " + result.getUsageSummary());
        System.out.println("Account flags  : " + result.getAccountFlags());
        System.out.println("Recommendations:");
        for (Recommendation r : result.getRecommendations()) {
            System.out.println(" - " + r.getMessage() + "  [tags=" + r.getTags() + "]");
        }
    }
}
