# Graph Report - med-broker-app  (2026-04-25)

## Corpus Check
- 212 files · ~129,593 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 695 nodes · 785 edges · 31 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `useCurrency()` - 27 edges
2. `useNotification()` - 18 edges
3. `predict()` - 15 edges
4. `chatWithRag()` - 12 edges
5. `useUser()` - 10 edges
6. `useCart()` - 9 edges
7. `predict()` - 7 edges
8. `StegoTrainer` - 6 edges
9. `DemandForecastModel` - 6 edges
10. `main()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyProvider()` --calls--> `getUserCurrencyPreference()`  [INFERRED]
  frontend\src\context\CurrencyContext.jsx → frontend\src\utils\currency.js
- `useNotification()` --calls--> `VendorCommunication()`  [INFERRED]
  frontend\src\context\NotificationContext.jsx → frontend\src\pages\vendor\Communication.jsx
- `DemandForecastModel` --uses--> `Generate realistic pharmaceutical demand data.`  [INFERRED]
  ai-ml\models\demand_forecasting\model_wrapper.py → ai-ml\models\demand_forecasting\train_model.py
- `DemandForecastModel` --uses--> `Load exported data from the backend API.`  [INFERRED]
  ai-ml\models\demand_forecasting\model_wrapper.py → ai-ml\models\demand_forecasting\train_model.py
- `main()` --calls--> `predict()`  [INFERRED]
  ai-ml\models\demand_forecasting\train_model.py → medpred_tmp\test.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (38): App(), ChatbotAccessGate(), Cart(), useCart(), AdminCatalog(), Catalog(), ChatbotPanel(), Checkout() (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (21): CBAM, ChannelAttention, compute_metrics(), ConvBlock, Discriminator, DownBlock, HidingNet, Double conv with BN+ReLU (like original U-Net paper). (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (33): buildFollowUpQuestion(), buildGroundedRecommendationReply(), buildIntakeReply(), chatWithRag(), createLLMReply(), embedText(), ensureSessionsLoaded(), extractSymptoms() (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (12): CBAM, ChannelAttention, compute_metrics(), ConvBlock, Discriminator, HidingNet, RevealNet, SpatialAttention (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (16): buildInsightMessage(), VendorAnalytics(), detectUserCurrency(), formatCurrency(), getCurrencyForCountry(), getCurrencyPreferenceKey(), getCurrencySymbol(), getStoredUserContext() (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (24): build_result_html(), debug_db(), ensure_diagnostic_log_table(), fetch_db_medicines_with_vendors(), fetch_disease_info_from_db(), get_db_connection(), get_medicines_for_disease(), get_model() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (16): DemandForecastModel, fetch_real_data(), generate_realistic_pharma_data(), Generate realistic pharmaceutical demand data.     Unlike random noise, this si, Wrapper that handles feature engineering + prediction., Accept a DataFrame with 5 base features, engineer extras, and predict., Fetch training data from MedBroker backend API., DemandForecastModel (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (13): bufferToDataUri(), ensureCloudinaryConfigured(), uploadMedicineImage(), uploadPrescriptionImage(), buildOrderSignature(), buildPricingSummary(), createOrder(), getOrderById() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (13): buildGatewayConfiguration(), createRazorpayOrder(), createRazorpayPayout(), createRazorpayVendorTransfers(), getConfiguredCommissionPercent(), getVendorLinkedAccountId(), handleRazorpayWebhook(), initiatePayment() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (14): get_conn(), main(), new_id(), parse_med_list(), seed_db.py — Populate Neon DB from CSV files.  Inserts:   1. Condition        ←, Insert ConditionMedicine join rows from medications.csv, Insert all 132 symptom column names from training CSV into Symptom table., Parse medication list string like \"['Med A', 'Med B']\" → ['Med A', 'Med B'] (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (6): AppError, AuthenticationError, ConflictError, ForbiddenError, NotFoundError, ValidationError

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (5): authenticate(), authenticateOptional(), validatePassword(), validatePasswordChange(), verifyToken()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (10): calculateVendorOrderRevenue(), formatVendorOrder(), getAnalytics(), getDashboard(), getDemandForecast(), getRangeStart(), getVendorAndInventory(), getVendorMedicineIds() (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.31
Nodes (9): getVendorPendingBalanceCents(), getVendorProfile(), mapConflictError(), mapVendorProfile(), normalizePhone(), requestWithdrawal(), updateVendorProfile(), validateEmail() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.38
Nodes (7): forecast(), load_model(), evaluate_model(), get_model(), load_1mg_data(), load_csv_data(), predict()

### Community 15 - "Community 15"
Cohesion: 0.44
Nodes (8): clearAccountScopedData(), clearAuthData(), emitAuthChanged(), fetchCurrentUser(), getAuthHeaders(), getToken(), getUser(), setAuthData()

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (3): Dataset, StegoDataset, StegoDataset

### Community 17 - "Community 17"
Cohesion: 0.46
Nodes (7): fetchRates(), isDatabaseConnectivityError(), persistRatesWithRetry(), runExchangeRateSync(), startExchangeRateScheduler(), upsertRates(), wait()

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (2): normalizeOriginValue(), stripWrappingQuotes()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (5): connectWithRetry(), executeWithTransientRetry(), isTransientDbTerminationError(), reconnectWithRetry(), wait()

### Community 21 - "Community 21"
Cohesion: 0.53
Nodes (4): fetchRatesFromApi(), getLatestRates(), isDatabaseConnectivityError(), wait()

### Community 23 - "Community 23"
Cohesion: 0.6
Nodes (3): parseUniqueTarget(), toCustomerConflictError(), toVendorConflictError()

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (3): buildConversationIcon(), normalizeConversation(), VendorCommunication()

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (3): get_conn(), main(), fix_3_mismatches.py — Links medicines to the 3 diseases that had name mismatches

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (2): resolveOrderItemUnitPriceCents(), run()

### Community 27 - "Community 27"
Cohesion: 0.83
Nodes (3): buildOrderReceiptPdf(), centsToCurrency(), safeText()

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (2): buildQueryParams(), getStoredUserContext()

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (2): runLevel(), sleep()

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (2): errorHandler(), isTransientDatabaseError()

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): generateImageUrl(), ResponsiveImage()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (1): About()

## Knowledge Gaps
- **28 isolated node(s):** `Shared DemandForecastModel wrapper class. Must be importable by both the traini`, `Wrapper that handles feature engineering + prediction.`, `Accept a DataFrame with 5 base features, engineer extras, and predict.`, `Read connection string from .streamlit/secrets.toml as a fallback.`, `Given a list of symptom strings (display format, e.g. 'Chest Pain'),     returns` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 19`** (6 nodes): `escapeRegExp()`, `normalizeOriginValue()`, `probeDatabaseHealth()`, `stripWrappingQuotes()`, `wildcardToRegex()`, `app.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (4 nodes): `test-order-pricing.js`, `orderPricing.util.js`, `resolveOrderItemUnitPriceCents()`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `buildQueryParams()`, `getAuthHeaders()`, `getStoredUserContext()`, `catalog.service.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (3 nodes): `loadtest-1000.js`, `runLevel()`, `sleep()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (3 nodes): `error.middleware.js`, `errorHandler()`, `isTransientDatabaseError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (3 nodes): `ResponsiveImage.jsx`, `generateImageUrl()`, `ResponsiveImage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `About()`, `About.jsx`, `About.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StegoDataset` connect `Community 16` to `Community 1`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `StegoDataset` connect `Community 16` to `Community 3`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useCurrency()` connect `Community 0` to `Community 4`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `useCurrency()` (e.g. with `OrderSummary()` and `CurrencySelector()`) actually correct?**
  _`useCurrency()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `useNotification()` (e.g. with `NotificationBar()` and `Cart()`) actually correct?**
  _`useNotification()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `useUser()` (e.g. with `ChatbotAccessGate()` and `ChatbotPanel()`) actually correct?**
  _`useUser()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Shared DemandForecastModel wrapper class. Must be importable by both the traini`, `Wrapper that handles feature engineering + prediction.`, `Accept a DataFrame with 5 base features, engineer extras, and predict.` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._