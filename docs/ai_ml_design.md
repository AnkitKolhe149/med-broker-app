# AI/ML Design

## Overview

MedBroker integrates AI and Machine Learning capabilities to provide intelligent features that enhance user experience, improve medicine recommendations, and enable smart disease prediction.

**Technology Stack:**
- Python 3.8+
- Flask - REST API framework
- scikit-learn - Machine learning algorithms
- NLTK - Natural Language Processing
- spaCy - Advanced NLP
- pandas - Data processing
- numpy - Numerical computing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MedBroker Frontend                       │
│                     (React + Vite)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ API Calls
        ┌─────────────┼──────────────┬─────────────┐
        │             │              │             │
        ▼             ▼              ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  Chatbot API │ │Disease   │ │Recommend │ │ Search API   │
│   (Flask)    │ │ Predict  │ │  ation   │ │  (Elastic)   │
└─────┬────────┘ │  API     │ │   API    │ └──────────────┘
      │          └──────────┘ └──────────┘
      │
  ┌───▼────────────────────────────────────────┐
  │     Python ML Services (Flask Apps)        │
  ├──────────────────────────────────────────┤
  │ • Intent Classification (NLTK)             │
  │ • Named Entity Recognition (spaCy)        │
  │ • Response Generation                      │
  │ • Disease Prediction (Trained Models)     │
  │ • Medicine Recommendation (Collaborative) │
  │ • Price Prediction (Time Series)          │
  └────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   PostgreSQL Database       │
│   (Training Data, Models)   │
└─────────────────────────────┘
```

---

## 1. AI Chatbot Module

### Purpose
Provide 24/7 automated customer support by understanding user queries and providing relevant medicine information or support.

### Features

#### A. Intent Classification
**Problem:** Understand what the user is asking about

**Solution:** Multi-class text classification using NLTK

**Supported Intents:**
- `medicine_info` - Asking for medicine details
- `symptom_query` - Describing symptoms
- `order_status` - Checking order
- `complaint` - Filing complaint
- `payment_issue` - Payment problems
- `delivery_query` - Delivery tracking
- `general_inquiry` - General questions
- `recommendation_request` - Asking for recommendations

**Training Data:**
```
Sample queries classified by intent:
- "What is aspirin used for?" → medicine_info
- "I have a headache, what should I take?" → symptom_query
- "Where is my order?" → order_status
- "The medicine is expired" → complaint
- "Payment failed" → payment_issue
- "When will my order arrive?" → delivery_query
- "Your working hours?" → general_inquiry
- "Recommend something for cold" → recommendation_request
```

**Implementation:**
```python
from nltk.tokenize import word_tokenize
from nltk.classify import NaiveBayesClassifier
from nltk.corpus import stopwords

# Train classifier on labeled intent data
# Use features: word frequency, TF-IDF
# Model: Naive Bayes, SVM, or Neural Network
```

#### B. Named Entity Recognition (NER)
**Problem:** Extract medicine names, symptoms, dosages from user input

**Solution:** spaCy NER + Domain-specific training

**Entities to Extract:**
- MEDICINE - Medicine name (e.g., "Aspirin")
- SYMPTOM - Symptom/disease (e.g., "headache")
- DOSAGE - Dosage information (e.g., "500mg")
- QUANTITY - Amount (e.g., "2 tablets")
- DURATION - Time period (e.g., "3 days")

**Example:**
```
Input: "I need Aspirin 500mg, 2 tablets for 3 days for headache"
Output:
- MEDICINE: "Aspirin"
- DOSAGE: "500mg"
- QUANTITY: "2 tablets"
- DURATION: "3 days"
- SYMPTOM: "headache"
```

#### C. Response Generation
**Problem:** Generate natural, helpful responses

**Solution:** Rule-based + template-based responses mapped to extracted entities

**Algorithm:**
```python
1. Classify user intent
2. Extract entities using NER
3. Query database for relevant medicines
4. Generate response from template

Example Response Templates:
- For medicine_info: "Aspirin is used for {usage}. Price: ₹{price}. Available stock: {stock}"
- For symptom_query: "Based on your {symptom}, I recommend {medicine}. Dosage: {dosage}"
- For order_status: "Your order {order_id} is {status}. Estimated delivery: {date}"
```

### API

**POST** `/api/ai/chatbot`

**Request:**
```json
{
  "message": "I have a severe headache, what medicine should I take?",
  "userId": "uuid",
  "conversationHistory": [
    { "role": "user", "message": "Hi" },
    { "role": "bot", "message": "Hello! How can I help?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "For headaches, I recommend Aspirin 500mg or Ibuprofen 400mg. Both are available in stock.",
    "medicines": [
      {
        "id": "uuid",
        "name": "Aspirin 500mg",
        "price": 45.00,
        "stock": 150,
        "rating": 4.5
      }
    ],
    "intent": "recommendation_request",
    "confidence": 0.95
  }
}
```

---

## 2. Disease Prediction Module

### Purpose
Predict potential diseases/conditions based on user-described symptoms and recommend appropriate medicines.

### Approach

#### A. Symptom-to-Disease Mapping
**Data Source:** WHO ICD-10 database + medical research

**Sample Mappings:**
```
Symptoms → Common Diseases
- Fever + Cough + Throat pain → Common Cold / Flu
- Headache + Weakness → Migraine / Anemia
- Chest pain + Shortness of breath → Heart issue / Asthma
- Nausea + Vomiting → Gastritis / Food poisoning
- Joint pain + Swelling → Arthritis / Gout
```

#### B. Machine Learning Model

**Algorithm:** Logistic Regression / Random Forest / Neural Network

**Training Data:**
```
Medical dataset with:
- Symptoms (features): fever, cough, throat pain, fatigue, etc.
- Disease diagnosis (label): cold, flu, throat infection, etc.
- 5000+ historical cases
```

**Features:**
- Symptom presence (binary: yes/no)
- Symptom severity (1-10 scale)
- Duration (days)
- Age group
- Gender
- Previous medical history

**Output:**
```
Disease Prediction: [
  { disease: "Common Cold", probability: 0.75, confidence: "High" },
  { disease: "Allergic Rhinitis", probability: 0.15, confidence: "Medium" },
  { disease: "Flu", probability: 0.10, confidence: "Low" }
]
```

**Important:** This is for informational purposes only and NOT a medical diagnosis. Users are advised to consult doctors.

### API

**POST** `/api/ai/disease-predict`

**Request:**
```json
{
  "symptoms": [
    { "name": "fever", "severity": 8 },
    { "name": "cough", "severity": 6 },
    { "name": "sore_throat", "severity": 7 }
  ],
  "duration_days": 2,
  "age": 28,
  "gender": "Male"
}
```

**Response:**
```json
{
  "success": true,
  "disclaimer": "This is not a medical diagnosis. Please consult a healthcare professional.",
  "data": {
    "predictions": [
      {
        "disease": "Common Cold",
        "probability": 0.78,
        "symptoms_matched": ["fever", "cough", "sore_throat"],
        "recommended_medicines": [
          {
            "id": "uuid",
            "name": "Paracetamol 500mg",
            "usage": "For fever and body ache",
            "dosage": "1 tablet every 4-6 hours",
            "price": 25.00
          },
          {
            "id": "uuid",
            "name": "Cough Syrup (Dextromethorphan)",
            "usage": "For dry cough",
            "dosage": "2 teaspoons twice daily",
            "price": 150.00
          }
        ]
      },
      {
        "disease": "Flu",
        "probability": 0.18,
        "symptoms_matched": ["fever", "cough"]
      }
    ]
  }
}
```

---

## 3. Medicine Recommendation Engine

### Purpose
Provide personalized medicine and health product recommendations based on user behavior, history, and preferences.

### Algorithms

#### A. Collaborative Filtering
**Principle:** Users who liked similar medicines in the past will likely like similar recommendations

**Steps:**
1. Build user-medicine interaction matrix
2. Find similar users based on purchase history
3. Recommend medicines purchased by similar users

**Example:**
```
User A bought: Aspirin, Cough Syrup, Multivitamin
User B bought: Aspirin, Cough Syrup, Iron Supplement

→ User B probably needs Cough Syrup (similar to User A)
→ Recommend Multivitamin to User B (what User A liked)
```

#### B. Content-Based Filtering
**Principle:** Recommend medicines similar to what user has purchased before

**Medicine Features:**
- Category
- Composition
- Price range
- Target symptoms
- Manufacturer
- Rating

**Algorithm:**
- Calculate medicine similarity using cosine similarity
- Recommend top N similar medicines not yet purchased

#### C. Hybrid Approach
**Combine:**
1. Collaborative filtering (user behavior)
2. Content-based (medicine similarity)
3. User profile (age, condition, allergies)
4. Popularity scores
5. Rating & reviews

### API

**GET** `/api/ai/recommendations`

**Query Parameters:**
```
?userId=uuid&limit=10&category=pain-relief&forSymptom=headache
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "uuid",
        "name": "Aspirin 500mg",
        "reason": "Similar to medicines you bought before",
        "price": 45.00,
        "rating": 4.5,
        "stock": 150,
        "vendor": "Apollo Pharmacy",
        "score": 0.92
      },
      {
        "id": "uuid",
        "name": "Melatonin 5mg",
        "reason": "Frequently bought with pain relief medicines",
        "price": 280.00,
        "rating": 4.3,
        "score": 0.87
      }
    ]
  }
}
```

---

## 4. Search Optimization Module

### Purpose
Improve medicine search results with NLP understanding and spell correction

### Techniques

#### A. Spell Correction
**Problem:** User types "spirine" instead of "aspirin"

**Solution:** Edit distance algorithm + dictionary-based matching

```python
from difflib import SequenceMatcher

# Suggest correct spelling
user_query = "spirine"
suggestions = spell_correct(user_query)
# Output: ["aspirin", "sparine"]
```

#### B. Query Expansion
**Problem:** User searches "paracetamol" but we have "acetaminophen"

**Solution:** Synonym database + NLP understanding

```
paracetamol = acetaminophen = APAP
cough syrup = expectorant = antitussive

Expanded search: [paracetamol, acetaminophen, APAP]
```

#### C. Semantic Search
**Problem:** User searches "medicine for cold" - generic search engines fail

**Solution:** Extract intent and symptoms, then search

```
Input: "medicine for cold"
→ Intent: recommendation_request
→ Disease: common_cold
→ Related symptoms: fever, cough, throat pain
→ Expanded search: medicines for [fever, cough, throat pain, cold]
```

---

## 5. Price Prediction & Trend Analysis

### Purpose
Predict medicine price trends and help users make informed purchasing decisions

### Model
**Algorithm:** Time Series Forecasting (ARIMA, Prophet)

**Input Data:**
- Historical prices
- Demand patterns
- Seasonal trends
- Market trends

**Output:**
```
Medicine: Aspirin 500mg
Current Price: ₹45
7-day forecast:
- Day 1: ₹45 (→ Buy now)
- Day 2: ₹46 ↑
- Day 3: ₹48 ↑
- Day 4: ₹50 ↑ (peak)
- Day 5: ₹48 ↓
- Day 6: ₹47 ↓
- Day 7: ₹45 ↓ (best time to buy)
```

### API

**GET** `/api/ai/price-forecast/:medicineId`

**Response:**
```json
{
  "success": true,
  "data": {
    "medicineId": "uuid",
    "medicineName": "Aspirin 500mg",
    "currentPrice": 45.00,
    "forecast": [
      { "date": "2026-02-12", "predictedPrice": 45.00, "confidence": 0.95 },
      { "date": "2026-02-13", "predictedPrice": 46.00, "confidence": 0.93 }
    ],
    "recommendation": "Price likely to increase. Buy now.",
    "trend": "upward"
  }
}
```

---

## Data Collection & Privacy

### Data Sources
- User search queries (anonymized)
- Purchase history
- Medical literature
- Government health databases
- User feedback & reviews

### Privacy Measures
- Anonymization of personal health data
- HIPAA compliance
- No storage of sensitive patient information
- Encrypted data transmission
- User consent for data usage

---

## Model Training & Evaluation

### Training Pipeline
```
1. Data Collection → 2. Preprocessing → 3. Feature Engineering
        ↓                    ↓                    ↓
4. Model Training → 5. Validation → 6. Testing → 7. Deployment
```

### Performance Metrics

| Module | Metric | Target |
|--------|--------|--------|
| Intent Classification | Accuracy | >95% |
| Disease Prediction | Precision | >90% |
| Recommendations | Precision@10 | >85% |
| Search Results | MRR (Mean Reciprocal Rank) | >0.8 |

### Continuous Improvement
- Retrain models monthly with new data
- A/B test different algorithms
- Monitor user feedback
- Update training data with new diseases/medicines

---

## Deployment

### Infrastructure
- Python Flask servers on cloud
- Model serving via containerization (Docker)
- API rate limiting: 100 requests/min per user
- Caching for frequently used predictions

### Monitoring
- API response time: <500ms
- Model accuracy tracking
- Error rate monitoring
- User feedback collection

---

## Future Enhancements

1. **Deep Learning Models**
   - BERT/GPT for better conversational AI
   - CNN for image-based medicine identification
   - RNN for sequence prediction

2. **Advanced NLP**
   - Multi-language support
   - Sentiment analysis for reviews
   - Emotion detection in customer messages

3. **Personalization**
   - Health risk assessment
   - Preventive medicine recommendations
   - Drug interaction checking

4. **Telemedicine Integration**
   - Connect users with doctors
   - Virtual consultations
   - Prescription verification

5. **Wearable Device Integration**
   - Real-time health data from smartwatches
   - Activity-based recommendations
   - Health trend monitoring
