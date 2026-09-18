# Business card QR code

These files encode one address and nothing else:

```
https://www.cortexaaicrm.com/card
```

Scanning the code opens that address, which records that the visit came from the
printed card and then shows the normal Cortexa landing page. Nothing else about
the page changes for the visitor.

## Files for the printer

| File | Use |
|---|---|
| `cortexa-card-qr.svg` | vector, the right choice for professional printing at any size |
| `cortexa-card-qr-2400.png` | 3280 x 3280 pixels, for layouts that need an image |
| `cortexa-card-qr-1200.png` | 1640 x 1640 pixels, for proofs and digital use |

Error correction is set to the highest level, so the code still scans when part
of it is scuffed or covered on a printed card.

## Printing notes

Print it at 20 mm or larger on the card, in solid black on a plain light
background, and keep the white margin that is already part of the file. Do not
crop it, stretch it, or place artwork on top of it.

Each file was decoded after export and resolves to the address above. The code
was also checked scaled down to 120 pixels, blurred, rotated and at low
contrast, and still reads correctly.
