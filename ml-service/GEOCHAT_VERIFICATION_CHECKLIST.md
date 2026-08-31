# GeoChat Verification Checklist

Run this checklist after the GeoChat download finishes to verify functionality.

## Post-Download Steps

1. [ ] **Verify model files exist**
   - Check `ml-service/models/downloaded/` for the complete GeoChat model files (`config.json`, `pytorch_model.bin` or `model.safetensors`, etc.).

2. [ ] **Start FastAPI**
   - Navigate to `ml-service` and run: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

3. [ ] **GET /ml/models**
   - Access `http://localhost:8000/ml/models` and confirm GeoChat is listed.

4. [ ] **Confirm GeoChat = READY**
   - The status for VQA should change from `LOADING` to `READY` after startup.

5. [ ] **Send test image & question**
   - Run a test query:
     ```bash
     curl -X POST http://localhost:8000/ml/vqa \
       -F "image=@sample-data/test.tif" \
       -F "query=What is this?"
     ```

6. [ ] **Confirm answer**
   - Verify that the JSON response contains `"success": true` and a valid `"answer"`.

7. [ ] **Test through Node backend**
   - Restart the Node backend if necessary and test the VQA LangChain tool execution.

8. [ ] **Test through frontend**
   - Open the SatQuery AI web interface, upload an image, and run a VQA query. Verify the results render successfully and the model badge says "GeoChat".
