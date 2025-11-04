# Quiz Generation Debugging Guide

## Step 1: Check Backend Status
```bash
# 1. Start Spring Boot backend
cd backend/SkillForge_BackendPart
./mvnw spring-boot:run

# 2. Verify backend is running
curl http://localhost:8080/api/ai/gemini-generate-quiz
# Should return 405 Method Not Allowed (means endpoint exists)
```

## Step 2: Test Backend Endpoint Directly
```bash
# Test the Gemini endpoint with curl
curl -X POST http://localhost:8080/api/ai/gemini-generate-quiz \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "React useContext",
    "questionCount": 3,
    "difficulty": "intermediate",
    "courseContext": "Web Development"
  }'
```

## Step 3: Check Frontend Configuration
1. **Verify axiosConfig.js:**
```javascript
// src/api/axiosConfig.js
const api = axios.create({
  baseURL: 'http://localhost:8080', // Must match backend port
});
```

2. **Check browser console for:**
- "Testing backend connectivity..." message
- "Backend test response: XXX" status
- Network tab for failed requests

## Step 4: Verify Gemini API Key
1. **Check application.properties:**
```properties
gemini.api.key=AIzaSyCAysFPEB1sViDLawNDmKmFYQMfnFxTxJk
```

2. **Test Gemini API directly:**
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCAysFPEB1sViDLawNDmKmFYQMfnFxTxJk" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Generate 2 multiple choice questions about React useContext"
          }
        ]
      }
    ]
  }'
```

## Step 5: Common Error Solutions

### Error: "Backend connectivity test failed"
**Cause:** Spring Boot backend not running
**Solution:** Start backend with `./mvnw spring-boot:run`

### Error: "404 Not Found"
**Cause:** Endpoint doesn't exist or wrong URL
**Solution:** Check AIController.java has `@PostMapping("/gemini-generate-quiz")`

### Error: "CORS policy"
**Cause:** Frontend and backend on different origins
**Solution:** Add `@CrossOrigin(origins = "http://localhost:3000")` to controller

### Error: "Gemini API key not configured"
**Cause:** Missing or invalid API key
**Solution:** Set correct key in application.properties

### Error: "401 Unauthorized" from Gemini
**Cause:** Invalid Gemini API key
**Solution:** Get new key from Google AI Studio

## Step 6: Enable Debug Logging
Add to application.properties:
```properties
logging.level.com.skillforge=DEBUG
logging.level.org.springframework.web=DEBUG
```

## Step 7: Test with Simple Topic
Try with a simple topic like "JavaScript" first, then "React useContext"

## Expected Working Flow:
1. Frontend sends request to `/api/ai/gemini-generate-quiz`
2. Backend receives request in AIController
3. Backend calls Gemini API with your key
4. Gemini returns AI-generated questions
5. Backend formats and returns to frontend
6. Frontend displays real AI questions

## If All Else Fails:
Check browser Network tab for:
- Request URL
- Request payload
- Response status
- Response body
- Any CORS errors
