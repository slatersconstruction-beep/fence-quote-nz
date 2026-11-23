# Karl Quotes

Fence and deck quoting app (repo name `fence-quote-nz`; the web address stays the same).

**Live app:** https://slatersconstruction-beep.github.io/fence-quote-nz/

Mobile-first web app for Slaters Construction: quote a straight timber paling fence and/or a timber deck onsite (tick Fence, Deck or both on the Measure screen), turn it into a client quote, take acceptance on the phone, and send a real PDF by WhatsApp or email.

- Plain HTML/CSS/JS, no server, no account. PDF built on the phone with jsPDF (bundled in `vendor/`, works offline).
- Data (profile, prices, quotes, accepted records) lives in the phone browser's local storage. Export/Import backup in Settings → Data.
- `calc.js` holds all takeoff and GST maths and can be run in Node for checks. `deckTakeoff()` sizes joists and bearers from the NZS 3604 span tables in `data.js` (`FQ_DATA.deckRules`) and picks the cheapest combination.
- Prices (`data.js`) are Bunnings NZ / Mitre 10 NZ public retail prices with product codes and links, checked 24 Nov 2026. Each item has an `id`, `supplier` and `item` code so a supplier price list can later be imported and matched.

## Add to Home Screen
**iPhone (Safari):** open the link → Share button (square with arrow) → *Add to Home Screen* → Add. Open it from the new icon from then on. (Safari and the Home Screen app keep separate data, so use one.)

**Android (Chrome):** open the link → ⋮ menu → *Add to Home screen* / *Install app* → Install.

## 10-minute phone test script
1. Tap **✎ My business details** (top of the Measure screen) and enter your real details (GST number optional). They save automatically; tap **← Back to your quote** when done.
2. Settings → Prices: tap each item marked **estimate**, check the Bunnings page, type the shelf price.
3. Measure: length `12`, height `1.8`. Check posts 8 (cheapest long-enough stock, 3.0 m on 24 Nov 2026), 3 rail rows, 80 palings installed / 88 to buy, nails, screws, concrete.
4. Paling → choose the 2400 mm paling; open Estimating options, change embedment 0.6 → 0.9: post goes 2.4 → 2.7 m and concrete bags go up.
5. Quote: Karl 8 h × $75, + Add person 6 h × $45, + Add person 4 h × $55 → Labour $1,090.00.
6. Enter a test client name and your own address/email (not a real client).
7. Send → **Open PDF to check**. Then **Share PDF** → WhatsApp → send to yourself (or "Message yourself"). Confirm it arrives as a PDF document and opens.
8. Send → **Share PDF** → Mail or Gmail → address it to yourself → confirm the PDF is attached → Send → open it from your inbox.
9. **Client review & accept**: type a name, tick, Accept. Open the accepted quote and Share/Download the PDF: it should say ACCEPTED by … with date and time.
10. Change a price and your phone number, fully close the app (swipe it away), reopen → Saved → the accepted quote still shows the original price and details.
11. Settings → Data → Export backup, keep the file.

## Deck test
1. Measure: tick **Deck** (untick Fence for a deck-only quote).
2. Length `6` (along the house), width `4`, height `0.6`, attached ticked.
3. Check: 12 piles, 2 rows of bearers, 15 joists at 450 centres, ~290 m of decking, screws, hangers, bolts, ties, wire dogs, nails, concrete.
4. Carry on to Quote and Send as for a fence. The quote, PDF, email and invoice say "deck".
