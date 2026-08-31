import { DemoScenario, InputType } from '../types';

// Helper to create synthetic satellite SVG data URLs for instant demo testing
export function createSatelliteSvgDataUrl(type: 'optical' | 'sar' | 'before' | 'after' | 'port'): string {
  let svg = '';
  if (type === 'optical' || type === 'port') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="water" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f2b48"/>
          <stop offset="100%" stop-color="#071829"/>
        </linearGradient>
        <linearGradient id="veg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2d5a27"/>
          <stop offset="100%" stop-color="#1e3f1a"/>
        </linearGradient>
        <pattern id="urban" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#4a5568"/>
          <rect x="5" y="5" width="12" height="12" fill="#718096"/>
          <rect x="22" y="5" width="13" height="12" fill="#a0aec0"/>
          <rect x="5" y="22" width="12" height="13" fill="#cbd5e0"/>
          <rect x="22" y="22" width="13" height="13" fill="#4a5568"/>
          <line x1="0" y1="20" x2="40" y2="20" stroke="#2d3748" stroke-width="2"/>
          <line x1="20" y1="0" x2="20" y2="40" stroke="#2d3748" stroke-width="2"/>
        </pattern>
      </defs>
      <!-- Base Terrain -->
      <rect width="800" height="600" fill="url(#veg)"/>
      <!-- River / Coastal Water Body -->
      <path d="M 0,150 Q 250,120 400,280 T 800,380 L 800,600 L 0,600 Z" fill="url(#water)"/>
      <!-- Urban / Built-up Sector -->
      <polygon points="120,40 380,30 350,220 80,240" fill="url(#urban)" stroke="#2b6cb0" stroke-width="2"/>
      <!-- Port / Industrial Dock -->
      <polygon points="420,280 620,290 600,420 380,390" fill="#4a5568" stroke="#cbd5e0" stroke-width="2"/>
      <!-- Runways / Transport Corridor -->
      <line x1="10" y1="50" x2="790" y2="120" stroke="#e2e8f0" stroke-width="8" stroke-dasharray="25,10"/>
      <line x1="100" y1="10" x2="160" y2="250" stroke="#cbd5e0" stroke-width="4"/>
      <!-- Annotations overlay -->
      <text x="30" y="40" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="bold">SAT-OPTICAL-SENSOR-4B (RGB+NIR)</text>
      <text x="30" y="580" fill="#94a3b8" font-family="monospace" font-size="12">GSD: 0.5m | RES: 1024x1024 | EPSG:4326</text>
    </svg>`;
  } else if (type === 'sar') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <radialGradient id="sarNoise" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2a2a2a"/>
          <stop offset="100%" stop-color="#111111"/>
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#sarNoise)"/>
      <!-- Water is completely specular / dark in SAR -->
      <path d="M 0,150 Q 250,120 400,280 T 800,380 L 800,600 L 0,600 Z" fill="#050505"/>
      <!-- Built-up areas have intense double-bounce backscatter (bright white/yellow) -->
      <polygon points="120,40 380,30 350,220 80,240" fill="#e2e8f0" fill-opacity="0.85" stroke="#ffffff" stroke-width="3"/>
      <!-- Industrial metallic structures / ships -->
      <polygon points="420,280 620,290 600,420 380,390" fill="#ffffff" stroke="#38bdf8" stroke-width="3"/>
      <!-- Runway smooth surface (dark) -->
      <line x1="10" y1="50" x2="790" y2="120" stroke="#1a202c" stroke-width="8"/>
      <!-- Speckle lines -->
      <line x1="0" y1="300" x2="800" y2="300" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.2"/>
      <text x="30" y="40" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="bold">SENTINEL-1 C-BAND SAR (VV+VH)</text>
      <text x="30" y="580" fill="#94a3b8" font-family="monospace" font-size="12">POL: Dual-Pol | BACKSCATTER: sigma0 | EPSG:4326</text>
    </svg>`;
  } else if (type === 'before') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#2d5a27"/>
      <path d="M 100,600 L 250,400 L 300,100 L 200,0 L 0,0 L 0,600 Z" fill="#1b3817"/>
      <!-- Dense Forest area -->
      <circle cx="550" cy="300" r="180" fill="#163313"/>
      <!-- Small rural village -->
      <rect x="480" y="260" width="80" height="70" fill="#718096"/>
      <line x1="0" y1="350" x2="800" y2="330" stroke="#a0aec0" stroke-width="4"/>
      <text x="30" y="40" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="bold">T1: ACQUISITION DATE 2022-03-15</text>
      <text x="30" y="70" fill="#10b981" font-family="monospace" font-size="13">Dense Canopy: 78% | Built-up Area: 8%</text>
    </svg>`;
  } else if (type === 'after') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#4a5d23"/>
      <path d="M 100,600 L 250,400 L 300,100 L 200,0 L 0,0 L 0,600 Z" fill="#1b3817"/>
      <!-- Cleared / Expanded Urban Development (RED/GRAY CHANGE ZONE) -->
      <circle cx="550" cy="300" r="180" fill="#8c6239" stroke="#f43f5e" stroke-width="4" stroke-dasharray="10,5"/>
      <!-- New commercial building grid -->
      <rect x="420" y="180" width="240" height="220" fill="#64748b" stroke="#cbd5e0" stroke-width="2"/>
      <line x1="420" y1="240" x2="660" y2="240" stroke="#334155" stroke-width="3"/>
      <line x1="420" y1="300" x2="660" y2="300" stroke="#334155" stroke-width="3"/>
      <line x1="0" y1="350" x2="800" y2="330" stroke="#e2e8f0" stroke-width="8"/>
      <text x="30" y="40" fill="#f43f5e" font-family="monospace" font-size="16" font-weight="bold">T2: ACQUISITION DATE 2024-03-15</text>
      <text x="30" y="70" fill="#f59e0b" font-family="monospace" font-size="13">Dense Canopy: 32% | Built-up Area: 44% (+36% Expansion)</text>
    </svg>`;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo-1-vqa',
    title: 'Demo 1: Single Image VQA',
    subtitle: 'Visual Question Answering on Coastal Port & Urban Infrastructure',
    inputType: InputType.SINGLE_IMAGE,
    query: 'Describe the land-cover and major objects visible in this image.',
    expectedTask: 'VQA',
    description: 'Validates single-image visual comprehension, detecting coastal shipping infrastructure, arterial transport lines, and residential settlement density.',
    images: [
      {
        name: 'coastal_port_optical.tif',
        url: createSatelliteSvgDataUrl('port'),
        label: 'Optical Satellite RGB (0.5m GSD)',
      },
    ],
  },
  {
    id: 'demo-2-caption',
    title: 'Demo 2: Single Image Scene Description',
    subtitle: 'Automated Remote-Sensing Captioning & Structural Synopsis',
    inputType: InputType.SINGLE_IMAGE,
    query: 'Describe this image.',
    expectedTask: 'CAPTION',
    description: 'Generates an executive scene description identifying geographical features, land-cover distribution percentages, and notable environmental structures.',
    images: [
      {
        name: 'high_res_coastal_scene.png',
        url: createSatelliteSvgDataUrl('optical'),
        label: 'High-Res Optical Image',
      },
    ],
  },
  {
    id: 'demo-3-change',
    title: 'Demo 3: Bi-Temporal Change Analysis',
    subtitle: '2-Year Temporal Expansion & Deforestation Assessment (2022 vs 2024)',
    inputType: InputType.BI_TEMPORAL,
    query: 'What changed between these two dates, and where did the change occur?',
    expectedTask: 'CHANGE_ANALYSIS',
    description: 'Analyzes two spatially registered temporal satellite captures to detect urban sprawl, tree canopy clearance, and infrastructural road expansion with exact change delta metrics.',
    images: [
      {
        name: 'sentinel2_t1_2022.tif',
        url: createSatelliteSvgDataUrl('before'),
        label: 'T1: March 2022 (Pre-expansion)',
      },
      {
        name: 'sentinel2_t2_2024.tif',
        url: createSatelliteSvgDataUrl('after'),
        label: 'T2: March 2024 (Post-expansion)',
      },
    ],
  },
  {
    id: 'demo-4-optical-sar',
    title: 'Demo 4: Optical + SAR Cross-Modal Fusion',
    subtitle: 'Multi-Sensor Synergistic Analysis (Sentinel-2 Optical + Sentinel-1 SAR)',
    inputType: InputType.OPTICAL_SAR,
    query: 'Use the optical and SAR images together to identify built-up and water-covered regions.',
    expectedTask: 'OPTICAL_SAR_ANALYSIS',
    description: 'Fuses high-resolution optical surface reflectance with Synthetic Aperture Radar (SAR) double-bounce backscatter to identify dense structures and specular water bodies with multi-spectral fidelity.',
    images: [
      {
        name: 'sentinel2_optical_band.tif',
        url: createSatelliteSvgDataUrl('optical'),
        label: 'Modality 1: Optical RGB Sensor',
      },
      {
        name: 'sentinel1_sar_cband.tif',
        url: createSatelliteSvgDataUrl('sar'),
        label: 'Modality 2: SAR C-Band Microwave (VV+VH)',
      },
    ],
  },
];
