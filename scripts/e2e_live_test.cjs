const fs = require("fs");
const path = require("path");

const API_BASE = "http://localhost:4000";
const FRONTEND_BASE = "http://localhost:5173";

async function runLiveSmokeTest() {
  console.log("=================================================================");
  console.log("       GARAA B2B PLATFORM - END-TO-END LIVE SMOKE TEST          ");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Frontend check
    console.log("1. Checking Frontend (Vite server on port 5173)...");
    const feRes = await fetch(FRONTEND_BASE);
    const feHtml = await feRes.text();
    assert(feRes.status === 200, "Frontend responds with HTTP 200 OK");
    assert(feHtml.includes('id="zx"'), "Contains authentic 3D particle canvas (#zx)");
    assert(feHtml.includes("GaraaBackend"), "Contains GaraaBackend real API bridge");
    assert(feHtml.includes("B2B Switcher & API Keys"), "Contains B2B Persona Switcher & API Key modal");

    // 2. Backend Health Check
    console.log("\n2. Checking Backend Health Check...");
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && (healthJson.status === "HEALTHY" || healthJson.status === "ok"), "Backend health returns status: HEALTHY");

    // 3. Swagger Docs Check
    console.log("\n3. Checking OpenAPI / Swagger Documentation...");
    const docsRes = await fetch(`${API_BASE}/api/v1/docs/`);
    assert(docsRes.status === 200, "Swagger interactive API documentation responds with HTTP 200");

    // 4. Authentication (Sarah Chen - Org Owner)
    console.log("\n4. Authenticating Sarah Chen (Org Owner)...");
    const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sarah.owner@acmeglobal.example",
        password: "Garaa@2026!"
      })
    });
    const loginData = await loginRes.json();
    const sarahToken = loginData.data?.token || loginData.token;
    assert(loginRes.status === 200 && !!sarahToken, "Logged in as Sarah Chen, received JWT");

    // 5. Organization Details
    console.log("\n5. Fetching Multi-Tenant Organization...");
    const orgRes = await fetch(`${API_BASE}/api/v1/organizations/me`, {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    const orgData = await orgRes.json();
    const orgPayload = orgData.data || orgData;
    assert(orgRes.status === 200 && orgPayload.organization?.name === "Acme Global Recruiting", "Retrieved Acme Global Recruiting tenant details");
    assert(orgPayload.members && orgPayload.members.length >= 2, `Organization has active members count: ${orgPayload.members?.length}`);

    // 6. Upload Document
    console.log("\n6. Uploading Document to Tenant Private Storage...");
    const boundary = "----GaraaMultipartFormBoundary" + Math.random().toString(36).substring(2);
    const fileContent = "GARAA_OFFICIAL_ACADEMIC_CREDENTIAL_VERIFICATION_SAMPLE_DATA";
    const bodyBuffer = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample_degree.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      Buffer.from(fileContent),
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="documentCategory"\r\n\r\nEDUCATION\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await fetch(`${API_BASE}/api/v1/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sarahToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuffer
    });
    const uploadData = await uploadRes.json();
    const uploadPayload = uploadData.data || uploadData;
    const docRecord = uploadPayload.document || uploadPayload;
    const docId = docRecord.id;
    const docHash = docRecord.sha256Hash || docRecord.fileHashSha256;
    assert(uploadRes.status === 201 && !!docId, "Document uploaded to secure tenant-isolated storage");
    assert(!!docHash, `Generated SHA-256 hash: ${docHash?.substring(0, 16)}...`);

    // 7. Execute 8-Check Modular Verification Engine
    console.log("\n7. Executing 8-Check Modular Verification Engine...");
    const verifyRes = await fetch(`${API_BASE}/api/v1/verifications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sarahToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        documentId: docId,
        subjectName: "Sarah Chen",
        documentCategory: "EDUCATION",
        declaredIdentifier: "STF-2026-ENG-881"
      })
    });
    const verifyData = await verifyRes.json();
    const verifyPayload = verifyData.data || verifyData;
    const verifyRecord = verifyPayload.verification || verifyPayload;
    const verificationId = verifyRecord.id;
    const checks = verifyPayload.checks || verifyRecord.checks || [];

    assert(verifyRes.status === 201 && !!verificationId, `Verification executed (ID: ${verificationId})`);
    assert(checks.length === 8, `All 8 modular checks completed (count: ${checks.length})`);

    // 8. Retrieve Verification Report
    console.log("\n8. Retrieving Formal Verification Report...");
    const reportRes = await fetch(`${API_BASE}/api/v1/reports/${verificationId}`, {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    const reportData = await reportRes.json();
    const reportPayload = reportData.data || reportData;
    const reportRecord = reportPayload.report || reportPayload;
    assert(reportRes.status === 200 && (reportRecord.id === verificationId || reportRecord.verificationId === verificationId), "Retrieved structured verification report");

    // 9. Single Report CSV Export
    console.log("\n9. Testing Individual Verification CSV Stream...");
    const csvRes = await fetch(`${API_BASE}/api/v1/reports/${verificationId}/csv`, {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    const csvText = await csvRes.text();
    assert(csvRes.status === 200 && (csvText.includes("Check_Code") || csvText.includes("Check Code")), "CSV stream contains standard check headers");

    // 10. Organization Summary CSV Export
    console.log("\n10. Testing Organization Summary CSV Export...");
    const summaryCsvRes = await fetch(`${API_BASE}/api/v1/reports/export/summary-csv`, {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    const summaryCsvText = await summaryCsvRes.text();
    assert(summaryCsvRes.status === 200 && (summaryCsvText.includes("Request_Number") || summaryCsvText.includes("Verification ID")), "Summary CSV streamed valid export dataset");

    // 11. Dashboard Aggregated Metrics
    console.log("\n11. Testing Dashboard Real Database Analytics...");
    const dashRes = await fetch(`${API_BASE}/api/v1/dashboard/stats`, {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    const dashData = await dashRes.json();
    const dashPayload = dashData.data || dashData;
    const totalRequests = dashPayload.totalRequests ?? dashPayload.stats?.totalRequests ?? 0;
    assert(dashRes.status === 200 && totalRequests >= 1, `Dashboard metrics active: ${totalRequests} total verifications recorded`);

    // 12. B2B Live API Key Authentication
    console.log("\n12. Testing B2B Live API Key Authentication...");
    const liveKeyRes = await fetch(`${API_BASE}/api/v1/dashboard/stats`, {
      headers: { "X-API-Key": "gk_live_8f3a9e2c4b7d1059a6c8e3f2d1b09482" }
    });
    assert(liveKeyRes.status === 200, "B2B Live API Key successfully authenticated endpoint");

    // 13. Audit Log Trail
    console.log("\n13. Inspecting Tamper-Evident Append-Only Audit Trail...");
    const auditRes = await fetch(`${API_BASE}/api/v1/audit-logs`, {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    const auditData = await auditRes.json();
    const auditPayload = auditData.data || auditData;
    const logsList = Array.isArray(auditPayload) ? auditPayload : (auditPayload.auditLogs || []);
    assert(auditRes.status === 200 && logsList.length > 0, `Audit trail contains ${logsList.length} verified immutable events`);

    // 14. Elena Rostova Reviewer Sign-off
    console.log("\n14. Testing Elena Rostova (Authorized Reviewer) Sign-off Flow...");
    const reviewerLoginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "reviewer@acmeglobal.example",
        password: "Garaa@2026!"
      })
    });
    const reviewerLoginData = await reviewerLoginRes.json();
    const reviewerToken = reviewerLoginData.data?.token || reviewerLoginData.token;

    const reviewSignoffRes = await fetch(`${API_BASE}/api/v1/verifications/${verificationId}/review`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${reviewerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        decision: "VERIFIED",
        notes: "Audited Stanford credential against registrar signature and seal. Authenticity confirmed."
      })
    });
    const reviewSignoffData = await reviewSignoffRes.json();
    const reviewSignoffPayload = reviewSignoffData.data || reviewSignoffData;
    const signoffRecord = reviewSignoffPayload.verification || reviewSignoffPayload;
    assert(reviewSignoffRes.status === 200 && signoffRecord.status === "VERIFIED", "Compliance Reviewer recorded official human sign-off");

    console.log("\n=================================================================");
    console.log(`   END-TO-END SMOKE TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
    console.log("=================================================================\n");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("\n[FATAL ERROR IN SMOKE TEST]:", error);
    process.exit(1);
  }
}

runLiveSmokeTest();
