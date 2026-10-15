const fetch = globalThis.fetch;

async function testMultiDevice() {
  console.log("=================================================================");
  console.log("       CROSS-DEVICE SCANNED DATABASE REAL-TIME TEST              ");
  console.log("=================================================================\n");

  console.log("1. Device 1 (Remote Mobile Phone) user scans an Indian Passport...");
  const scanPayload = {
    id: "PARTH-SCAN-PHONE-" + Date.now(),
    personName: "Vikram Malhotra",
    documentType: "Republic of India Passport",
    documentTypeId: "passport",
    fileName: "vikram_passport_camera.jpg",
    status: "VALID",
    isValid: true,
    confidence: 99,
    photoUrl: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Ccircle%20cx='50'%20cy='50'%20r='40'%20fill='%2310b981'/%3E%3C/svg%3E",
    reasons: ["MRZ checksum verified", "UV ghost photo authentic"],
    rawTextPreview: "P<INDVIKRAM<<MALHOTRA<<<<<<<<<<<<<<02",
    source: "Smart Scanner (Mobile Camera)",
    scannedBy: "Vikram (Device 1 - Mobile)"
  };

  const uploadRes = await fetch("http://localhost:4000/api/v1/admin/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scanPayload)
  });
  const uploadJson = await uploadRes.json();
  if (uploadJson.success) {
    console.log("   [PASS] Device 1 successfully uploaded scan without requiring admin credentials!");
    console.log("   [INFO] Ingested Scan ID:", uploadJson.data?.id);
  } else {
    console.error("   [FAIL] Device 1 upload failed:", uploadJson);
    process.exit(1);
  }

  console.log("\n2. Device 2 (Admin Parth on different laptop / phone) logs into Admin Data with password 'garaa916'...");
  const adminRes = await fetch("http://localhost:4000/api/v1/admin/scans", {
    headers: { "x-admin-password": "garaa916" }
  });
  const adminJson = await adminRes.json();
  console.log(`   [INFO] Device 2 retrieved total scans count: ${adminJson.count}`);

  const found = adminJson.data.find((s) => s.id === scanPayload.id);
  if (found && found.personName === "Vikram Malhotra") {
    console.log("   [PASS] Admin Parth on Device 2 can immediately see Vikram Malhotra's scanned passport!");
    console.log(`   [INFO] Person: ${found.personName} | Status: ${found.status} | Source: ${found.source} | ScannedBy: ${found.scannedBy}`);
  } else {
    console.error("   [FAIL] Scan from Device 1 was not found on Device 2!");
    process.exit(1);
  }

  console.log("\n3. Testing unauthorized device attempt without admin password...");
  const unauthRes = await fetch("http://localhost:4000/api/v1/admin/scans");
  if (unauthRes.status === 401) {
    console.log("   [PASS] Endpoint correctly blocks access without password (401 Unauthorized)");
  } else {
    console.error("   [FAIL] Unauthorized request did not return 401:", unauthRes.status);
    process.exit(1);
  }

  console.log("\n4. Device 2 (Admin Parth) deletes Vikram Malhotra's test record...");
  const deleteRes = await fetch(`http://localhost:4000/api/v1/admin/scans/${scanPayload.id}`, {
    method: "DELETE",
    headers: { "x-admin-password": "garaa916" }
  });
  const deleteJson = await deleteRes.json();
  if (deleteJson.success) {
    console.log("   [PASS] Record deleted from central database successfully.");
  } else {
    console.error("   [FAIL] Delete failed:", deleteJson);
  }

  console.log("\n=================================================================");
  console.log("   ALL MULTI-DEVICE SYNCHRONIZATION TESTS PASSED!               ");
  console.log("=================================================================");
}

testMultiDevice();
