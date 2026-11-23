const fs = require('fs');

// 1. Update themes.css
let themesCss = fs.readFileSync('shadboard/full-kit/src/app/themes.css', 'utf8');

const themeUpdates = {
  'theme-zinc': {
    border: '240 6% 82%',
    muted: '240 6% 92%',
    mutedFg: '215 16% 34%',
    sidebarFg: '220 25% 18%',
    sidebarBorder: '240 6% 83%',
  },
  'theme-slate': {
    border: '215 20% 82%',
    muted: '215 20% 92%',
    mutedFg: '215 16% 34%',
    sidebarFg: '220 25% 18%',
    sidebarBorder: '215 20% 83%',
  },
  'theme-stone': {
    border: '30 12% 82%',
    muted: '30 15% 92%',
    mutedFg: '25 15% 34%',
    sidebarFg: '25 20% 18%',
    sidebarBorder: '30 12% 83%',
  },
  'theme-gray': {
    border: '220 13% 82%',
    muted: '220 13% 92%',
    mutedFg: '215 16% 34%',
    sidebarFg: '220 25% 18%',
    sidebarBorder: '220 13% 83%',
  },
  'theme-neutral': {
    border: '0 0% 82%',
    muted: '0 0% 92%',
    mutedFg: '0 0% 34%',
    sidebarFg: '0 0% 18%',
    sidebarBorder: '0 0% 83%',
  },
  'theme-red': {
    border: '0 25% 83%',
    muted: '0 30% 93%',
    mutedFg: '0 20% 34%',
    sidebarFg: '0 25% 18%',
    sidebarBorder: '0 25% 84%',
  },
  'theme-rose': {
    border: '350 28% 83%',
    muted: '350 30% 93%',
    mutedFg: '350 20% 34%',
    sidebarFg: '350 25% 18%',
    sidebarBorder: '350 28% 84%',
  },
  'theme-orange': {
    border: '30 35% 82%',
    muted: '30 40% 92%',
    mutedFg: '25 25% 34%',
    sidebarFg: '25 25% 18%',
    sidebarBorder: '30 35% 83%',
  },
  'theme-green': {
    border: '145 25% 82%',
    muted: '145 30% 92%',
    mutedFg: '145 20% 32%',
    sidebarFg: '145 25% 18%',
    sidebarBorder: '145 25% 83%',
  },
  'theme-blue': {
    border: '216 30% 82%',
    muted: '216 30% 92%',
    mutedFg: '216 25% 34%',
    sidebarFg: '216 30% 18%',
    sidebarBorder: '216 30% 83%',
  },
  'theme-yellow': {
    border: '48 40% 81%',
    muted: '48 45% 92%',
    mutedFg: '45 30% 32%',
    sidebarFg: '45 35% 18%',
    sidebarBorder: '48 40% 82%',
  },
  'theme-violet': {
    border: '265 25% 82%',
    muted: '265 30% 92%',
    mutedFg: '265 25% 34%',
    sidebarFg: '265 30% 18%',
    sidebarBorder: '265 25% 83%',
  },
  'theme-ocean': {
    border: '204 35% 82%',
    muted: '204 35% 92%',
    mutedFg: '204 30% 32%',
    sidebarFg: '204 40% 16%',
    sidebarBorder: '204 35% 83%',
  },
  'theme-purple': {
    border: '277 22% 82%',
    muted: '275 25% 92%',
    mutedFg: '275 25% 32%',
    sidebarFg: '275 35% 16%',
    sidebarBorder: '277 22% 83%',
  },
  'theme-monochrome': {
    border: '220 13% 80%',
    muted: '220 14% 91%',
    mutedFg: '0 0% 28%',
    sidebarFg: '0 0% 15%',
    sidebarBorder: '220 13% 81%',
  },
};

for (const [themeClass, values] of Object.entries(themeUpdates)) {
  const blockRegex = new RegExp(`(\\.${themeClass}\\s*\\{[\\s\\S]*?)(@variant dark)`, 'm');
  const match = themesCss.match(blockRegex);
  if (match) {
    let lightBlock = match[1];
    lightBlock = lightBlock.replace(/--border:\s*[^;]+;/, `--border: ${values.border};`);
    lightBlock = lightBlock.replace(/--input:\s*[^;]+;/, `--input: ${values.border};`);
    lightBlock = lightBlock.replace(/--muted:\s*[^;]+;/, `--muted: ${values.muted};`);
    lightBlock = lightBlock.replace(/--muted-foreground:\s*[^;]+;/, `--muted-foreground: ${values.mutedFg};`);
    lightBlock = lightBlock.replace(/--sidebar-foreground:\s*[^;]+;/, `--sidebar-foreground: ${values.sidebarFg};`);
    lightBlock = lightBlock.replace(/--sidebar-border:\s*[^;]+;/, `--sidebar-border: ${values.sidebarBorder};`);
    
    themesCss = themesCss.replace(match[1], lightBlock);
  }
}

fs.writeFileSync('shadboard/full-kit/src/app/themes.css', themesCss, 'utf8');
console.log('themes.css updated with darker borders and readable text');

// 2. Update globals.css :root
let globalsCss = fs.readFileSync('shadboard/full-kit/src/app/globals.css', 'utf8');

globalsCss = globalsCss.replace(/--border:\s*220\s*13%\s*91%;/, '--border: 220 14% 82%;');
globalsCss = globalsCss.replace(/--input:\s*220\s*13%\s*91%;/, '--input: 220 14% 82%;');
globalsCss = globalsCss.replace(/--sidebar-border:\s*220\s*13%\s*91%;/, '--sidebar-border: 220 14% 83%;');
globalsCss = globalsCss.replace(/--muted-foreground:\s*220\s*8\.9%\s*46\.1%;/g, '--muted-foreground: 215 16% 34%;');
globalsCss = globalsCss.replace(/--sidebar-foreground:\s*220\s*8\.9%\s*46\.1%;/g, '--sidebar-foreground: 220 25% 18%;');

fs.writeFileSync('shadboard/full-kit/src/app/globals.css', globalsCss, 'utf8');
console.log('globals.css updated with darker borders and text');

