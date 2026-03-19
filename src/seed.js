// Temporary seed script - can be removed after testing
// Run this in the browser console to populate dummy data:
// paste the contents of this file into the browser DevTools Console

(function seedData() {
  const clients = [
    { id: "c1", name: "Αλφα Logistics Α.Ε.", afm: "800123456", contactPerson: "Νίκος Παπαδόπουλος", phone: "6971234567", email: "nikos@alpha-logistics.gr", address: "Λεωφ. Αθηνών 42, Αθήνα", notes: "Πάντα πληρώνει εγκαίρως" },
    { id: "c2", name: "Βήτα Μεταφορές Ε.Π.Ε.", afm: "801234567", contactPerson: "Μαρία Γεωργίου", phone: "6982345678", email: "maria@beta-trans.gr", address: "Εγνατία 100, Θεσσαλονίκη", notes: "Παραδόσεις μόνο πρωί" },
    { id: "c3", name: "Γάμμα Εφοδιαστική Α.Ε.", afm: "802345678", contactPerson: "Δημήτρης Κωνσταντίνου", phone: "6993456789", email: "info@gamma-supply.gr", address: "Δεκελείας 15, Πάτρα", notes: "" },
    { id: "c4", name: "Delta Distributions Α.Ε.", afm: "803456789", contactPerson: "Ελένη Νικολάου", phone: "6944567890", email: "elena@delta-dist.gr", address: "Σταδίου 8, Λάρισα", notes: "Πελάτης VIP - προτεραιότητα" },
    { id: "c5", name: "Epsilon Trade & Import", afm: "804567890", contactPerson: "Κώστας Αντωνίου", phone: "6955678901", email: "kostas@epsilon-trade.gr", address: "Μητροπόλεως 22, Ηράκλειο", notes: "Πληρωμή 30 ημέρες" },
    { id: "c6", name: "Ζήτα Αποθηκευτική Α.Ε.", afm: "805678901", contactPerson: "Σοφία Παπαναστασίου", phone: "6966789012", email: "sofia@zita-storage.gr", address: "Βιομηχανική Ζώνη Βόλου, Βόλος", notes: "" },
    { id: "c7", name: "Ήτα Cargo Solutions", afm: "806789012", contactPerson: "Αλέξης Μαρκόπουλος", phone: "6977890123", email: "alexis@ita-cargo.gr", address: "Λιμάνι Πειραιά, Αττική", notes: "Διεθνείς αποστολές μόνο" },
    { id: "c8", name: "Θήτα Express Α.Ε.", afm: "807890123", contactPerson: "Χρήστος Βασιλείου", phone: "6988901234", email: "hristos@tita-express.gr", address: "Βενιζέλου 33, Ιωάννινα", notes: "Εξπρές παραδόσεις" },
    { id: "c9", name: "Ιώτα Βιομηχανική Ε.Π.Ε.", afm: "808901234", contactPerson: "Αναστασία Θεοδώρου", phone: "6999012345", email: "anastasia@iota-ind.gr", address: "ΒΙΠΕ Πατρών, Πάτρα", notes: "Μεγάλοι όγκοι προϊόντων" },
    { id: "c10", name: "Κάπα Φρεσκαλιά Μ.Ε.Π.Ε.", afm: "809012345", contactPerson: "Γιώργης Μανωλάκης", phone: "6910123456", email: "giorgis@kapa-fresh.gr", address: "Λεωφ. Μεσογείων 180, Χαλάνδρι", notes: "Ψυγεία μεταφορές μόνο" }
  ];

  const products = [
    { id: "p1", name: "Χαρτοκιβώτιο Μεσαίο", code: "BOX-M-001", price: "1.20", quantity: "500", unit: "τεμ.", restockingNote: "Παραγγελία από Kraft Supplies", description: "Χαρτοκιβώτιο 40x30x30cm" },
    { id: "p2", name: "Χαρτοκιβώτιο Μεγάλο", code: "BOX-L-002", price: "2.10", quantity: "320", unit: "τεμ.", restockingNote: "", description: "Χαρτοκιβώτιο 60x40x40cm" },
    { id: "p3", name: "Χαρτοκιβώτιο Μικρό", code: "BOX-S-003", price: "0.75", quantity: "800", unit: "τεμ.", restockingNote: "", description: "Χαρτοκιβώτιο 25x20x20cm" },
    { id: "p4", name: "Παλέτα Ξύλινη Ευρωπαϊκή", code: "PAL-EUR-001", price: "8.50", quantity: "150", unit: "τεμ.", restockingNote: "Από ΧΩΡ ΑΕ", description: "Ευρωπαλέτα 120x80cm" },
    { id: "p5", name: "Παλέτα Πλαστική", code: "PAL-PL-002", price: "22.00", quantity: "60", unit: "τεμ.", restockingNote: "", description: "Πλαστική παλέτα επαναχρησιμοποιήσιμη" },
    { id: "p6", name: "Μεμβράνη Τυλίγματος Stretch", code: "STRCH-001", price: "4.80", quantity: "200", unit: "ρολό", restockingNote: "", description: "Διαφανής μεμβράνη 23μm 500m" },
    { id: "p7", name: "Ταινία Συσκευασίας Καφέ", code: "TAPE-BR-001", price: "1.50", quantity: "3", unit: "κιβώτιο", restockingNote: "ΧΑΜΗΛΟ - παραγγελία άμεσα", description: "Ταινία 48mmx66m, 36τεμ/κιβ" },
    { id: "p8", name: "Ταινία Συσκευασίας Διαφανής", code: "TAPE-TR-002", price: "1.40", quantity: "4", unit: "κιβώτιο", restockingNote: "Παραγγελία εβδομάδα", description: "Ταινία 48mmx66m, 36τεμ/κιβ" },
    { id: "p9", name: "Αερόστρωμα Κύπελλα", code: "BUBBLE-001", price: "12.00", quantity: "80", unit: "ρολό", restockingNote: "", description: "Φύλλο φυσαλίδων 50cm x 100m" },
    { id: "p10", name: "Αφρώδες Υλικό Προστασίας", code: "FOAM-001", price: "18.50", quantity: "45", unit: "τεμ.", restockingNote: "", description: "Φύλλο αφρώδους πολυαιθυλενίου 1x2m" },
    { id: "p11", name: "Σακούλες ΡΕ Μεσαίες", code: "BAG-PE-M", price: "0.08", quantity: "5000", unit: "τεμ.", restockingNote: "", description: "Διαφανείς σακούλες 30x40cm" },
    { id: "p12", name: "Σακούλες ΡΕ Μεγάλες", code: "BAG-PE-L", price: "0.15", quantity: "2200", unit: "τεμ.", restockingNote: "", description: "Διαφανείς σακούλες 50x70cm" },
    { id: "p13", name: "Ετικέτες Αποστολής A5", code: "LBL-A5-001", price: "0.05", quantity: "1000", unit: "τεμ.", restockingNote: "", description: "Αυτοκόλλητες ετικέτες" },
    { id: "p14", name: "Ετικέτες Επικίνδυνο", code: "LBL-HAZ-002", price: "0.12", quantity: "200", unit: "τεμ.", restockingNote: "", description: "Ετικέτες επικίνδυνου φορτίου" },
    { id: "p15", name: "Σφηνάκια Ασφαλείας Παλετών", code: "STR-SEC-001", price: "0.30", quantity: "600", unit: "τεμ.", restockingNote: "", description: "Γωνίες καρτόν προστασίας" },
    { id: "p16", name: "Χαρτί Πλήρωσης Κραφτ", code: "FILL-KFT-001", price: "3.20", quantity: "120", unit: "kg", restockingNote: "", description: "Χαρτί kraft για πλήρωση κενών" },
    { id: "p17", name: "Σφραγίδες Ασφαλείας Πλαστικές", code: "SEAL-PL-001", price: "0.25", quantity: "400", unit: "τεμ.", restockingNote: "", description: "Σφραγίδες μιας χρήσης" },
    { id: "p18", name: "Καλάθι Μεταφοράς Χύμα 600lt", code: "BIN-BULK-001", price: "35.00", quantity: "25", unit: "τεμ.", restockingNote: "", description: "Πλαστικό καλάθι 600lt" },
    { id: "p19", name: "Κλειδί Ασφαλείας Κοντέινερ", code: "LOCK-CARGO-001", price: "4.50", quantity: "90", unit: "τεμ.", restockingNote: "", description: "Κλειδαριά κοντέινερ" },
    { id: "p20", name: "Rack Μεταλλικό Αποθήκης", code: "RACK-M-001", price: "120.00", quantity: "10", unit: "τεμ.", restockingNote: "Παραγγελία 5 ακόμα", description: "Ράφι 120x60x180cm" },
    { id: "p21", name: "Rack Βαρέως Τύπου", code: "RACK-H-002", price: "285.00", quantity: "3", unit: "τεμ.", restockingNote: "", description: "Βαρύ ράφι 4 επιπέδων" },
    { id: "p22", name: "Καρότσι Χειρός 2 Τροχών", code: "CART-2W-001", price: "48.00", quantity: "8", unit: "τεμ.", restockingNote: "", description: "Αλουμινίου 250kg" },
    { id: "p23", name: "Καρότσι Πλατφόρμας 4 Τροχών", code: "CART-4W-002", price: "89.00", quantity: "5", unit: "τεμ.", restockingNote: "", description: "Πλατφόρμα 400kg" },
    { id: "p24", name: "Χαρτοταινία Σφράγισης Λευκή", code: "TAPE-WH-003", price: "1.60", quantity: "2", unit: "κιβώτιο", restockingNote: "ΧΑΜΗΛΟ - παραγγελία", description: "Ταινία 50mmx66m" },
    { id: "p25", name: "Δίχτυ Ασφαλείας Φορτηγού", code: "NET-TRK-001", price: "55.00", quantity: "12", unit: "τεμ.", restockingNote: "", description: "Δίχτυ 3x4m ανθεκτικό" },
    { id: "p26", name: "Ιμάντες Στερέωσης 5m", code: "STRAP-5M-001", price: "6.80", quantity: "70", unit: "τεμ.", restockingNote: "", description: "Ratchet 5m/2500daN" },
    { id: "p27", name: "Ιμάντες Στερέωσης 10m", code: "STRAP-10M-002", price: "11.50", quantity: "40", unit: "τεμ.", restockingNote: "", description: "Ratchet 10m/2500daN" },
    { id: "p28", name: "Κυτία Ψυγείου Μεταφοράς", code: "BOX-COOL-001", price: "3.50", quantity: "180", unit: "τεμ.", restockingNote: "", description: "Θερμομονωτικό κυτίο 30lt" },
    { id: "p29", name: "Gel Ψύξης 500g", code: "COOL-GEL-001", price: "1.80", quantity: "250", unit: "τεμ.", restockingNote: "", description: "Πακέτο ψύξης" },
    { id: "p30", name: "Ψυγείο Μεταφοράς 50lt", code: "COOLER-50L-001", price: "65.00", quantity: "7", unit: "τεμ.", restockingNote: "", description: "Φορητό ψυγείο πολυστυρένης" },
    { id: "p31", name: "Χαρτί Εκτύπωσης A4", code: "PAPER-A4-001", price: "4.90", quantity: "100", unit: "δέσμη", restockingNote: "", description: "80g/m² 500 φύλλα" },
    { id: "p32", name: "Μαρκαδόρος Ανεξίτηλος", code: "MARK-BK-001", price: "0.90", quantity: "150", unit: "τεμ.", restockingNote: "", description: "Μαρκαδόρος για κιβώτια" },
    { id: "p33", name: "Γάντια Εργασίας Νιτριλίου", code: "GLOVE-W-001", price: "2.20", quantity: "0", unit: "ζεύγος", restockingNote: "ΕΞΑΝΤΛΗΜΕΝΟ - παραγγελία άμεσα", description: "Γάντια νιτριλίου μεσαία" },
    { id: "p34", name: "Ανακλαστικό Γιλέκο", code: "VEST-REF-001", price: "5.50", quantity: "20", unit: "τεμ.", restockingNote: "", description: "EN ISO 20471 κίτρινο" },
    { id: "p35", name: "Κράνος Ασφαλείας", code: "HELM-001", price: "12.00", quantity: "15", unit: "τεμ.", restockingNote: "", description: "CE EN397 λευκό" },
    { id: "p36", name: "Παπούτσια Ασφαλείας S3", code: "BOOT-S3-001", price: "48.00", quantity: "0", unit: "ζεύγος", restockingNote: "ΕΞΑΝΤΛΗΜΕΝΟ - παραγγελία 10 ζεύγη", description: "Ατσάλινη μύτη S3" },
    { id: "p37", name: "GPS Tracking Συνδρομή", code: "GPS-SUB-001", price: "35.00", quantity: "15", unit: "άδεια", restockingNote: "", description: "Μηνιαία ανά όχημα" },
    { id: "p38", name: "Λιπαντικό Κλαρκ", code: "OIL-FLT-001", price: "8.00", quantity: "30", unit: "lt", restockingNote: "", description: "Λάδι υδραυλικού κλαρκ" },
    { id: "p39", name: "Μπαταρία Κλαρκ 48V", code: "BAT-FLT-001", price: "980.00", quantity: "2", unit: "τεμ.", restockingNote: "1 παραγγελία σε εξέλιξη", description: "48V/500Ah" },
    { id: "p40", name: "Φορτιστής Μπαταρίας 48V", code: "CHG-48V-001", price: "350.00", quantity: "1", unit: "τεμ.", restockingNote: "", description: "3-φάσης 80A" },
    { id: "p41", name: "Σφήνα Τροχοπέδης", code: "WHEEL-WDG-001", price: "3.00", quantity: "35", unit: "τεμ.", restockingNote: "", description: "Πλαστική σφήνα τροχών" },
    { id: "p42", name: "Τσάντα Μεταφοράς Εγγράφων", code: "BAG-DOC-001", price: "15.00", quantity: "22", unit: "τεμ.", restockingNote: "", description: "A4 με κλείσιμο ασφαλείας" },
    { id: "p43", name: "Πινακίδα ADR Επικίνδυνα", code: "SIGN-ADR-001", price: "18.00", quantity: "8", unit: "τεμ.", restockingNote: "", description: "Αλουμίνιο 30x40cm" },
    { id: "p44", name: "Πυροσβεστήρας 6kg CO2", code: "FIRE-6KG-001", price: "55.00", quantity: "6", unit: "τεμ.", restockingNote: "Επαναπλήρωση Μαΐου", description: "" },
    { id: "p45", name: "Κλιματιστικό Αποθήκης 18000BTU", code: "AC-18K-001", price: "1200.00", quantity: "1", unit: "τεμ.", restockingNote: "", description: "Inverter βιομηχανικό" },
    { id: "p46", name: "Φωτισμός LED Αποθήκης 200W", code: "LED-200W-001", price: "90.00", quantity: "10", unit: "τεμ.", restockingNote: "", description: "Highbay IP65" },
    { id: "p47", name: "Σκάλα Αλουμινίου 8 Σκαλοπάτια", code: "LADR-8S-001", price: "75.00", quantity: "3", unit: "τεμ.", restockingNote: "", description: "Διπλή σκάλα 3m" },
    { id: "p48", name: "Εκτυπωτής Ετικετών Θερμικός", code: "PRNT-LBL-001", price: "220.00", quantity: "2", unit: "τεμ.", restockingNote: "", description: "104mm/sec" },
    { id: "p49", name: "Ρολό Θερμικής Ετικέτας 100x150mm", code: "RLBL-100-001", price: "6.50", quantity: "60", unit: "ρολό", restockingNote: "", description: "500 ετικέτες ανά ρολό" },
    { id: "p50", name: "Σαρωτής Barcodes Bluetooth", code: "SCAN-BT-001", price: "180.00", quantity: "2", unit: "τεμ.", restockingNote: "", description: "2D wireless scanner" }
  ];

  const orders = [
    { id: "o1", clientId: "c1", product: "Παλέτα Ξύλινη Ευρωπαϊκή", amount: "50", agreedPrice: "8.00", totalPrice: "400.00", paymentOption: "immediate", deliveryPlace: "Αθήνα, Ελαιώνας", details: "Παράδοση πρωί 08:00-10:00", status: "completed", archived: false, createdAt: "2026-03-01T08:00:00.000Z" },
    { id: "o2", clientId: "c2", product: "Μεμβράνη Τυλίγματος Stretch", amount: "100", agreedPrice: "4.50", totalPrice: "450.00", paymentOption: "1month", deliveryPlace: "Θεσσαλονίκη, Λαγκαδάς", details: "Αποστολή με μεταφορική", status: "pending", archived: false, createdAt: "2026-03-05T10:00:00.000Z" },
    { id: "o3", clientId: "c4", product: "Ιμάντες Στερέωσης 5m", amount: "30", agreedPrice: "6.50", totalPrice: "195.00", paymentOption: "immediate", deliveryPlace: "Λάρισα Κέντρο", details: "VIP πελάτης - προτεραιότητα παράδοσης", status: "processing", archived: false, createdAt: "2026-03-10T09:00:00.000Z" },
    { id: "o4", clientId: "c3", product: "Χαρτοκιβώτιο Μεγάλο", amount: "200", agreedPrice: "2.00", totalPrice: "400.00", paymentOption: "2months", deliveryPlace: "Πάτρα, Βιομηχανική Ζώνη", details: "", status: "pending", archived: false, createdAt: "2026-03-12T11:00:00.000Z" },
    { id: "o5", clientId: "c5", product: "Σακούλες ΡΕ Μεγάλες", amount: "1000", agreedPrice: "0.13", totalPrice: "130.00", paymentOption: "3months", deliveryPlace: "Ηράκλειο, Αποθήκη Κ1", details: "Τιμή συμφωνήθηκε για bulk αγορά", status: "pending", archived: false, createdAt: "2026-03-13T14:00:00.000Z" },
    { id: "o6", clientId: "c7", product: "Δίχτυ Ασφαλείας Φορτηγού", amount: "5", agreedPrice: "52.00", totalPrice: "260.00", paymentOption: "immediate", deliveryPlace: "Πειραιάς, Λιμάνι", details: "Διεθνής αποστολή στη Ρουμανία", status: "completed", archived: false, createdAt: "2026-03-08T07:30:00.000Z" },
    { id: "o7", clientId: "c8", product: "Ταινία Συσκευασίας Καφέ", amount: "20", agreedPrice: "1.40", totalPrice: "28.00", paymentOption: "immediate", deliveryPlace: "Ιωάννινα Κέντρο", details: "Εξπρές - παράδοση αύριο", status: "processing", archived: false, createdAt: "2026-03-17T16:00:00.000Z" },
    { id: "o8", clientId: "c1", product: "Rack Μεταλλικό Αποθήκης", amount: "5", agreedPrice: "115.00", totalPrice: "575.00", paymentOption: "2months", deliveryPlace: "Αθήνα, Ελαιώνας", details: "Συναρμολόγηση επί τόπου", status: "pending", archived: false, createdAt: "2026-03-15T09:00:00.000Z" },
    { id: "o9", clientId: "c9", product: "Αερόστρωμα Κύπελλα", amount: "25", agreedPrice: "11.50", totalPrice: "287.50", paymentOption: "1month", deliveryPlace: "Πάτρα, ΒΙΠΕ", details: "", status: "completed", archived: false, createdAt: "2026-03-03T10:00:00.000Z" },
    { id: "o10", clientId: "c6", product: "Καρότσι Χειρός 2 Τροχών", amount: "3", agreedPrice: "45.00", totalPrice: "135.00", paymentOption: "immediate", deliveryPlace: "Βόλος, Βιομηχανική Ζώνη", details: "", status: "completed", archived: true, archivedAt: "2026-03-10T00:00:00.000Z", createdAt: "2026-02-20T08:00:00.000Z" },
    { id: "o11", clientId: "c10", product: "Gel Ψύξης 500g + Κυτία Ψυγείου", amount: "80", agreedPrice: "5.00", totalPrice: "400.00", paymentOption: "immediate", deliveryPlace: "Χαλάνδρι Αθήνα", details: "Ψυχρή αλυσίδα - ψυγεία μεταφοράς με gel ψύξης", status: "pending", archived: false, createdAt: "2026-03-18T08:00:00.000Z" },
    { id: "o12", clientId: "c2", product: "Παλέτα Ξύλινη Ευρωπαϊκή", amount: "30", agreedPrice: "8.20", totalPrice: "246.00", paymentOption: "immediate", deliveryPlace: "Θεσσαλονίκη, Λιμάνι", details: "Εξαγωγή Τουρκία", status: "cancelled", archived: true, archivedAt: "2026-03-12T00:00:00.000Z", createdAt: "2026-03-01T12:00:00.000Z" }
  ];

  localStorage.setItem('erp_clients', JSON.stringify(clients));
  localStorage.setItem('erp_products', JSON.stringify(products));
  localStorage.setItem('erp_orders', JSON.stringify(orders));
  console.log('Seeded! Clients:', clients.length, 'Products:', products.length, 'Orders:', orders.length);
  alert('Data seeded! Refresh the page (F5) to see it.');
})();
