const history = [
  {
    role: "user",
    parts: [
      {
        text: "FENDI ROMA SUNSHINE \n\nSMALL SIZE 25 CMS \n\nPRICE 3049/- ONLY \n\nSHIPPING EXTRA\n",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["3049"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "FENDI ROMA SUNSHINE \n\nSMALL SIZE 25 CMS \n\nPRICE 3,049/- ONLY \n\nSHIPPING EXTRA",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["3,049"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "FENDI ROMA SUNSHINE \n\nSMALL SIZE 25 CMS \n\nPRICE @3049$ ONLY \n\nSHIPPING EXTRA",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["3049"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "FENDI ROMA SUNSHINE \n\nSMALL SIZE 25 CMS \n\nPRICE @3,049$ ONLY \n\nSHIPPING EXTRA",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["3,049"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "Michael kors\n   Latest handbag\n\nIn 3 compartments\n\nWith long sling strap\n\nWith complete branding\n\nWith brand dust cover\n\nSize. 10”.11” apprx\n\nJust.  2,549+$",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["2,549"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "Premium Quality rabbit fur blanket by Florida in double bed size \nMaterial - super soft rabbit fur \nSize - 220 X 240 cm \nAvailable in Beautiful leather bag packing \nPriced - ₹4850\nWeight - 6 kg",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["4850"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "  GUCCI MARMONT\n       SHOWROOM EDITION\n\nTOP NOTCH QUALITY\n\nCOMES IN ORIGINAL 2 BOX PACKING\n\nMIRROR COPY\n\nEXCLUSIVELY FOR ELITE CLIENTS\n\n2 SIZE AVAILABLE\n\n\nBIG.   26 cm.        5800+$\n\nMini.  18 cm.           4800+$",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["5800", "4800"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "  GUCCI MARMONT\n       SHOWROOM EDITION\n\nTOP NOTCH QUALITY\n\nCOMES IN ORIGINAL 2 BOX PACKING\n\nMIRROR COPY\n\nEXCLUSIVELY FOR ELITE CLIENTS\n\n2 SIZE AVAILABLE\n\n\nBIG.   26 cm.        5,800+$\n\nMini.  18 cm.           4,800+$",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["5,800", "4,800"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: "BURBERRY\n\nMens\n\nRestocked on demand\nNew arrival\nUv protected\nAll Live images\nAll live videos\n\n\n849/- plain case\n949/- with original case and accessories\n\nFree shipping\n\nCarrybag 150 extra",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": ["849", "949"]}' }],
  },
  {
    role: "user",
    parts: [
      {
        text: `MICHAEL KORS KELLY TOP HANDLE
  
  WITH LONG SLING STRAP
  
  SIZE 22 CMS
  
  SHIPPING EXTRA`,
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: '```json\n{"response": []}' }],
  },
];

export default history;
