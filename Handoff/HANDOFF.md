# Hellenic Systems Trainer — handoff (v1.1, 24/10/2026)

One self-contained HTML page with three apps on a shared practice data set (kept in the browser, resettable). Built from `src/p1–p5` with `node tools/build.js`. Same approach as the Bizerba labeller trainer.

## Apps
- **Scale terminal** (station CUTEOL:10241026). Header brand reads "Scale Trainer". Built from 14 + 31 site photos.
- **FOPS 8 – Factory Scheduler**. Replica of the Windows client from one photo (window "2SFG SCUNTHORPE - Factory Scheduler"), all 30 orders for Sat 24 Oct 2026.
- **FOPSx Web**. No photos, so the whole design is assumed: label formats, designer, products, terminals, traceability.

## Data links between apps
- Scale labels → HX trans → FOPS 8 Done / Weight Done, visible after Refresh only (auto-refresh every 5 s in the trainer).
- FOPSx product/format edits → "Send products and formats" → terminal copy (scale preview).
- Scale CMD1 Download Label Formats → printer copy (printed label).
- Scale CMD0 Send a Message to FOPS → FOPS 8 Info › Messages.
- The scale weighs against the WIP order for today that has the PLU on a line (093015 TEST for 9980).

## Facts confirmed from photos
- A wrong CMD1/CMD0 code shows no message and opens the menu with only key-enabled buttons:
  - CMD1: Edit Hotshots, Download Label Formats, Printer/Preview Configuration.
  - CMD0: Delete Label, Unlock Scale, Change Media (PM43 Only).
- Those buttons come from Edit Codes › CMD0/1 Key Enables.
- Set-up Menu and Backup Management ask a separate SETUP security code.
- "Done" on the weighing screen is a box count: FO 093015 had 12 boxes / 111.56 kg in FOPS 8.
- Machine ID 13, Run Number 00505309. Serial barcode 13505309998000726640 = machine 13 + run 505309 + PLU 9980 + net 00726 + "640" (meaning unknown).
- Label 9980: chicken drumsticks HWC, GTIN 05063942535479, use by +10 days, "1KG X8 PER CASE".
- Sites in FOPS 8: 1, 2 (KFC), 3, 7 (bulk/butchery).

## Still assumed / photos wanted
- COMMAND Menu 1 page 2, Set-up Menu and Backup Management contents.
- Pages after Edit Products (E)dit.
- Greyed CMD0 names; meaning of PLU Functions Y/N.
- FOPS 8: Insert/Change dialog, Dispatch, Returns, Purchase orders.
- Any FOPSx Web / FOPSxEditor screen.

## Privacy
- Customer names and order figures come from internal 2SFG photos. Decide whether the repo should be public.
- No real passwords are stored. The printer serial and licence key are masked.
