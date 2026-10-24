/* ============================================================================
   affePhysics (affeLab: Physics) — Veritabanı, 118 Element, Standart Model
   ve scienceWiki Akademik Bilgi & Teori İçerikleri
   ============================================================================ */
(function () {
  'use strict';

  // Sembol | Türkçe ad | İngilizce ad | Atom kütlesi | Kategori | Elektronegatiflik | Hal (25 °C)
  const RAW = `H|Hidrojen|Hydrogen|1.008|nm|2.20|g
He|Helyum|Helium|4.0026|ng||g
Li|Lityum|Lithium|6.94|am|0.98|s
Be|Berilyum|Beryllium|9.0122|ae|1.57|s
B|Bor|Boron|10.81|md|2.04|s
C|Karbon|Carbon|12.011|nm|2.55|s
N|Azot|Nitrogen|14.007|nm|3.04|g
O|Oksijen|Oxygen|15.999|nm|3.44|g
F|Flor|Fluorine|18.998|hl|3.98|g
Ne|Neon|Neon|20.180|ng||g
Na|Sodyum|Sodium|22.990|am|0.93|s
Mg|Magnezyum|Magnesium|24.305|ae|1.31|s
Al|Alüminyum|Aluminium|26.982|pt|1.61|s
Si|Silisyum|Silicon|28.085|md|1.90|s
P|Fosfor|Phosphorus|30.974|nm|2.19|s
S|Kükürt|Sulfur|32.06|nm|2.58|s
Cl|Klor|Chlorine|35.45|hl|3.16|g
Ar|Argon|Argon|39.948|ng||g
K|Potasyum|Potassium|39.098|am|0.82|s
Ca|Kalsiyum|Calcium|40.078|ae|1.00|s
Sc|Skandiyum|Scandium|44.956|tm|1.36|s
Ti|Titanyum|Titanium|47.867|tm|1.54|s
V|Vanadyum|Vanadium|50.942|tm|1.63|s
Cr|Krom|Chromium|51.996|tm|1.66|s
Mn|Mangan|Manganese|54.938|tm|1.55|s
Fe|Demir|Iron|55.845|tm|1.83|s
Co|Kobalt|Cobalt|58.933|tm|1.88|s
Ni|Nikel|Nickel|58.693|tm|1.91|s
Cu|Bakır|Copper|63.546|tm|1.90|s
Zn|Çinko|Zinc|65.38|tm|1.65|s
Ga|Galyum|Gallium|69.723|pt|1.81|s
Ge|Germanyum|Germanium|72.630|md|2.01|s
As|Arsenik|Arsenic|74.922|md|2.18|s
Se|Selenyum|Selenium|78.971|nm|2.55|s
Br|Brom|Bromine|79.904|hl|2.96|l
Kr|Kripton|Krypton|83.798|ng|3.00|g
Rb|Rubidyum|Rubidium|85.468|am|0.82|s
Sr|Stronsiyum|Strontium|87.62|ae|0.95|s
Y|İtriyum|Yttrium|88.906|tm|1.22|s
Zr|Zirkonyum|Zirconium|91.224|tm|1.33|s
Nb|Niyobyum|Niobium|92.906|tm|1.6|s
Mo|Molibden|Molybdenum|95.95|tm|2.16|s
Tc|Teknesyum|Technetium|98|tm|1.9|s
Ru|Rutenyum|Ruthenium|101.07|tm|2.2|s
Rh|Rodyum|Rhodium|102.91|tm|2.28|s
Pd|Paladyum|Palladium|106.42|tm|2.20|s
Ag|Gümüş|Silver|107.87|tm|1.93|s
Cd|Kadmiyum|Cadmium|112.41|tm|1.69|s
In|İndiyum|Indium|114.82|pt|1.78|s
Sn|Kalay|Tin|118.71|pt|1.96|s
Sb|Antimon|Antimony|121.76|md|2.05|s
Te|Tellür|Tellurium|127.60|md|2.1|s
I|İyot|Iodine|126.90|hl|2.66|s
Xe|Ksenon|Xenon|131.29|ng|2.60|g
Cs|Sezyum|Caesium|132.91|am|0.79|s
Ba|Baryum|Barium|137.33|ae|0.89|s
La|Lantan|Lanthanum|138.91|ln|1.10|s
Ce|Seryum|Cerium|140.12|ln|1.12|s
Pr|Praseodim|Praseodymium|140.91|ln|1.13|s
Nd|Neodim|Neodymium|144.24|ln|1.14|s
Pm|Prometyum|Promethium|145|ln|1.13|s
Sm|Samaryum|Samarium|150.36|ln|1.17|s
Eu|Evropiyum|Europium|151.96|ln|1.2|s
Gd|Gadolinyum|Gadolinium|157.25|ln|1.20|s
Tb|Terbiyum|Terbium|158.93|ln|1.1|s
Dy|Disprosyum|Dysprosium|162.50|ln|1.22|s
Ho|Holmiyum|Holmium|164.93|ln|1.23|s
Er|Erbiyum|Erbium|167.26|ln|1.24|s
Tm|Tulyum|Thulium|168.93|ln|1.25|s
Yb|İterbiyum|Ytterbium|173.05|ln|1.1|s
Lu|Lutesyum|Lutetium|174.97|ln|1.27|s
Hf|Hafniyum|Hafnium|178.49|tm|1.3|s
Ta|Tantal|Tantalum|180.95|tm|1.5|s
W|Tungsten|Tungsten|183.84|tm|2.36|s
Re|Renyum|Rhenium|186.21|tm|1.9|s
Os|Osmiyum|Osmium|190.23|tm|2.2|s
Ir|İridyum|Iridium|192.22|tm|2.20|s
Pt|Platin|Platinum|195.08|tm|2.28|s
Au|Altın|Gold|196.97|tm|2.54|s
Hg|Cıva|Mercury|200.59|tm|2.00|l
Tl|Talyum|Thallium|204.38|pt|1.62|s
Pb|Kurşun|Lead|207.2|pt|2.33|s
Bi|Bizmut|Bismuth|208.98|pt|2.02|s
Po|Polonyum|Polonium|209|pt|2.0|s
At|Astatin|Astatine|210|hl|2.2|s
Rn|Radon|Radon|222|ng|2.2|g
Fr|Fransiyum|Francium|223|am|0.7|s
Ra|Radyum|Radium|226|ae|0.9|s
Ac|Aktinyum|Actinium|227|ac|1.1|s
Th|Toryum|Thorium|232.04|ac|1.3|s
Pa|Protaktinyum|Protactinium|231.04|ac|1.5|s
U|Uranyum|Uranium|238.03|ac|1.38|s
Np|Neptünyum|Neptunium|237|ac|1.36|s
Pu|Plütonyum|Plutonium|244|ac|1.28|s
Am|Amerikyum|Americium|243|ac|1.13|s
Cm|Küriyum|Curium|247|ac|1.28|s
Bk|Berkelyum|Berkelium|247|ac|1.3|s
Cf|Kaliforniyum|Californium|251|ac|1.3|s
Es|Aynştaynyum|Einsteinium|252|ac|1.3|s
Fm|Fermiyum|Fermium|257|ac|1.3|s
Md|Mendelevyum|Mendelevium|258|ac|1.3|s
No|Nobelyum|Nobelium|259|ac|1.3|s
Lr|Lavrensiyum|Lawrencium|266|ac|1.3|s
Rf|Rutherfordiyum|Rutherfordium|267|tm||?
Db|Dubniyum|Dubnium|268|tm||?
Sg|Seaborgiyum|Seaborgium|269|tm||?
Bh|Bohriyum|Bohrium|270|tm||?
Hs|Hassiyum|Hassium|277|tm||?
Mt|Meitneriyum|Meitnerium|278|uk||?
Ds|Darmstadtiyum|Darmstadtium|281|uk||?
Rg|Röntgenyum|Roentgenium|282|uk||?
Cn|Kopernikyum|Copernicium|285|tm||?
Nh|Nihonyum|Nihonium|286|uk||?
Fl|Flerovyum|Flerovium|289|uk||?
Mc|Moskovyum|Moscovium|290|uk||?
Lv|Livermoryum|Livermorium|293|uk||?
Ts|Tennesin|Tennessine|294|uk||?
Og|Oganesson|Oganesson|294|uk||?`;

  const CATS = {
    am: { name: 'Alkali Metal', color: '#ff3366' },
    ae: { name: 'Toprak Alkali Metal', color: '#f97316' },
    tm: { name: 'Geçiş Metali', color: '#f59e0b' },
    pt: { name: 'Zayıf Metal', color: '#10b981' },
    md: { name: 'Yarı Metal', color: '#06b6d4' },
    nm: { name: 'Ametal', color: '#00f2fe' },
    hl: { name: 'Halojen', color: '#818cf8' },
    ng: { name: 'Soy Gaz', color: '#a855f7' },
    ln: { name: 'Lantanit', color: '#ec4899' },
    ac: { name: 'Aktinit', color: '#f43f5e' },
    uk: { name: 'Süper-Ağır Sentetik', color: '#64748b' },
  };

  const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
  const CAP = { s: 2, p: 6, d: 10, f: 14 };
  const L_OF = { s: 0, p: 1, d: 2, f: 3 };

  const EXC = {
    24: { '4s': -1, '3d': 1 }, 29: { '4s': -1, '3d': 1 },
    41: { '5s': -1, '4d': 1 }, 42: { '5s': -1, '4d': 1 }, 44: { '5s': -1, '4d': 1 },
    45: { '5s': -1, '4d': 1 }, 46: { '5s': -2, '4d': 2 }, 47: { '5s': -1, '4d': 1 },
    57: { '4f': -1, '5d': 1 }, 58: { '4f': -1, '5d': 1 }, 64: { '4f': -1, '5d': 1 },
    78: { '6s': -1, '5d': 1 }, 79: { '6s': -1, '5d': 1 },
    89: { '5f': -1, '6d': 1 }, 90: { '5f': -2, '6d': 2 }, 91: { '5f': -1, '6d': 1 },
    92: { '5f': -1, '6d': 1 }, 93: { '5f': -1, '6d': 1 }, 96: { '5f': -1, '6d': 1 },
    103: { '6d': -1, '7p': 1 },
  };

  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (n) => String(n).split('').map((d) => SUP[+d] || d).join('');

  function madelung(n) {
    const res = {};
    let left = n;
    for (const s of ORDER) {
      if (left <= 0) break;
      const c = Math.min(CAP[s[1]], left);
      res[s] = c;
      left -= c;
    }
    return res;
  }

  function configOf(Z) {
    const c = madelung(Z);
    const ex = EXC[Z];
    if (ex) {
      for (const k in ex) {
        c[k] = (c[k] || 0) + ex[k];
        if (c[k] <= 0) delete c[k];
      }
    }
    return c;
  }

  function shellsOf(conf) {
    const arr = [];
    for (const k in conf) {
      const n = +k[0];
      arr[n - 1] = (arr[n - 1] || 0) + conf[k];
    }
    for (let i = 0; i < arr.length; i++) arr[i] = arr[i] || 0;
    return arr;
  }

  function configString(conf) {
    const parts = [];
    for (const s of ORDER) {
      if (conf[s] > 0) parts.push(s + sup(conf[s]));
    }
    return parts.join(' ');
  }

  function positionOf(Z) {
    if (Z === 1) return { period: 1, group: 1, col: 1, row: 1 };
    if (Z === 2) return { period: 1, group: 18, col: 18, row: 1 };
    const ranges = [[3, 10, 2], [11, 18, 3], [19, 36, 4], [37, 54, 5], [55, 86, 6], [87, 118, 7]];
    for (const [a, b, p] of ranges) {
      if (Z < a || Z > b) continue;
      const idx = Z - a;
      if (p <= 3) { const g = idx < 2 ? idx + 1 : idx + 11; return { period: p, group: g, col: g, row: p }; }
      if (p <= 5) return { period: p, group: idx + 1, col: idx + 1, row: p };
      if (idx < 2) return { period: p, group: idx + 1, col: idx + 1, row: p };
      if (idx < 17) return { period: p, group: null, col: idx + 1, row: p + 3 };
      const g = idx - 13;
      return { period: p, group: g, col: g, row: p };
    }
    return { period: 7, group: 18, col: 18, row: 7 };
  }

  function valenceQuantumNumbers(conf) {
    let lastSub = '1s';
    for (const s of ORDER) {
      if (conf[s] > 0) lastSub = s;
    }
    const n = +lastSub[0];
    const l = L_OF[lastSub[1]];
    const count = conf[lastSub];
    const boxes = CAP[lastSub[1]] / 2;
    const boxIdx = (count - 1) % boxes;
    const ml = -l + boxIdx;
    const ms = count <= boxes ? +0.5 : -0.5;
    return { n, l, ml, ms, subshell: lastSub };
  }

  const ELEMENTS = RAW.trim().split('\n').map((line, i) => {
    const [symbol, name, nameEn, mass, cat, en, phase] = line.trim().split('|');
    const Z = i + 1;
    const pos = positionOf(Z);
    const config = configOf(Z);
    const m = parseFloat(mass);
    const qn = valenceQuantumNumbers(config);
    return Object.assign({
      Z, symbol, name, nameEn, cat, phase,
      mass: m,
      en: en ? parseFloat(en) : null,
      neutrons: Math.max(0, Math.round(m) - Z),
      config,
      configStr: configString(config),
      shells: shellsOf(config),
      qn,
    }, pos);
  });

  // Weizsäcker Yarı-Ampirik Bağlanma Enerjisi ve Kütle Kusuru Hesaplayıcı
  function calcNuclearProperties(Z, N) {
    const A = Z + N;
    if (A <= 0) return { A: 0, Eb: 0, EbPerA: 0, massDefect: 0, mode: 'Yok', stable: false, halfLife: '0 s' };
    if (Z === 1 && N === 0) {
      return { A: 1, Eb: 0, EbPerA: 0, massDefect: 0, mode: 'Kararlı (Proton)', stable: true, halfLife: '∞ (Kararlı)' };
    }
    if (Z === 1 && N === 1) {
      return { A: 2, Eb: 2.224, EbPerA: 1.112, massDefect: 0.002388, mode: 'Kararlı (Döteryum)', stable: true, halfLife: '∞ (Kararlı)' };
    }
    if (Z === 2 && N === 2) {
      return { A: 4, Eb: 28.296, EbPerA: 7.074, massDefect: 0.030377, mode: 'Kararlı (Alfa / He-4)', stable: true, halfLife: '∞ (Kararlı)' };
    }

    const aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;
    let delta = 0;
    if (Z % 2 === 0 && N % 2 === 0) delta = aP / Math.sqrt(A);
    else if (Z % 2 === 1 && N % 2 === 1) delta = -aP / Math.sqrt(A);

    // Sihirli sayılar bonusu (2, 8, 20, 28, 50, 82, 126)
    const magic = [2, 8, 20, 28, 50, 82, 126];
    let shellBonus = 0;
    if (magic.includes(Z)) shellBonus += 2.2;
    if (magic.includes(N)) shellBonus += 2.2;

    const Eb = Math.max(0,
      aV * A
      - aS * Math.pow(A, 2 / 3)
      - aC * (Z * (Z - 1)) / Math.pow(A, 1 / 3)
      - aA * Math.pow(A - 2 * Z, 2) / A
      + delta + shellBonus
    );
    const EbPerA = Eb / A;
    const massDefect = Eb / 931.494; // akb (u)

    // Kararlılık vadisi merkez eğrisi: N_opt ≈ Z + 0.006 * A^(5/3)
    const Nopt = Z <= 20 ? Z : Math.round(Z + 0.0062 * Math.pow(Z * 2.15, 1.65));
    const diff = N - Nopt;

    // Özel bilinen izotoplar
    let mode = 'Kararlı';
    let stable = false;
    let halfLife = '∞ (Kararlı)';

    if (Z === 6 && N === 6) { stable = true; }
    else if (Z === 6 && N === 7) { stable = true; }
    else if (Z === 6 && N === 8) { stable = false; mode = 'β⁻ Bozunumu (→ ¹⁴N)'; halfLife = '5730 yıl'; }
    else if (Z === 92 && N === 143) { stable = false; mode = 'α Bozunumu / Termal Fisyon (²³⁵U)'; halfLife = '703,8 milyon yıl'; }
    else if (Z === 92 && N === 146) { stable = false; mode = 'α Bozunumu (²³⁸U)'; halfLife = '4,468 milyar yıl'; }
    else if (Z === 88 && N === 138) { stable = false; mode = 'α Bozunumu (²²⁶Ra → ²²²Rn)'; halfLife = '1600 yıl'; }
    else if (Z === 27 && N === 33) { stable = false; mode = 'β⁻ + γ Bozunumu (⁶⁰Co → ⁶⁰Ni)'; halfLife = '5,27 yıl'; }
    else if (Z > 82) {
      stable = false;
      if (diff > 3) mode = 'β⁻ Bozunumu (e⁻ + ν̄ₑ)';
      else mode = 'α Bozunumu (⁴He²⁺)';
      halfLife = Z === 84 ? '138,4 gün' : '1,2 × 10⁴ yıl';
    } else if (Z === 43 || Z === 61) {
      stable = false;
      mode = diff >= 0 ? 'β⁻ Bozunumu' : 'β⁺ / Elektron Yakalama';
      halfLife = '2,1 × 10⁵ yıl';
    } else {
      const tol = Z <= 20 ? 1 : (Z <= 50 ? 2 : 3);
      if (Math.abs(diff) <= tol) {
        stable = true;
      } else if (diff > tol) {
        stable = false;
        mode = 'β⁻ Bozunumu (n → p + e⁻ + ν̄ₑ)';
        halfLife = Math.abs(diff) > 5 ? '0,42 s' : '14,3 gün';
      } else {
        stable = false;
        mode = 'β⁺ Bozunumu (p → n + e⁺ + νₑ)';
        halfLife = Math.abs(diff) > 5 ? '0,18 s' : '22,5 dk';
      }
    }

    return { A, Z, N, Nopt, Eb, EbPerA, massDefect, mode, stable, halfLife };
  }

  // Standart Model Temel Parçacıkları
  const SM_PARTICLES = [
    // Kuarklar
    { id: 'u', sym: 'u', name: 'Yukarı (Up) Kuark', group: 'Kuark (1. Nesil)', mass: '2,16 MeV/c²', charge: '+2/3 e', spin: '1/2', color: '#ff3366', desc: 'Proton (uud) ve nötronu (udd) oluşturan en hafif kuarktır. Güçlü, elektromanyetik ve zayıf kuvvetle etkileşir.' },
    { id: 'd', sym: 'd', name: 'Aşağı (Down) Kuark', group: 'Kuark (1. Nesil)', mass: '4,67 MeV/c²', charge: '−1/3 e', spin: '1/2', color: '#ff3366', desc: 'Yukarı kuarktan biraz daha ağırdır; serbest nötronun β⁻ bozunumuyla protona dönüşmesini sağlar (d → u + W⁻).' },
    { id: 'c', sym: 'c', name: 'Tılsım (Charm) Kuark', group: 'Kuark (2. Nesil)', mass: '1,27 GeV/c²', charge: '+2/3 e', spin: '1/2', color: '#f43f5e', desc: '1974’te J/ψ mezonunun (c c̄) keşfiyle ("Kasım Devrimi") varlığı kanıtlanan 2. nesil kuarktır.' },
    { id: 's', sym: 's', name: 'Garip (Strange) Kuark', group: 'Kuark (2. Nesil)', mass: '93,4 MeV/c²', charge: '−1/3 e', spin: '1/2', color: '#f43f5e', desc: 'Kozmik ışınlarda keşfedilen Kaon (K) ve Hiperon (Λ, Σ, Ξ, Ω) parçacıklarına "gariplik" kuantum sayısını verir.' },
    { id: 't', sym: 't', name: 'Üst (Top) Kuark', group: 'Kuark (3. Nesil)', mass: '172,7 GeV/c²', charge: '+2/3 e', spin: '1/2', color: '#e11d48', desc: 'Bilinen en ağır temel parçacıktır (bir altın çekirdeği kadar ağırdır!). Hadronlaşmaya fırsat bulamadan 5×10⁻²⁵ s içinde bozunur.' },
    { id: 'b', sym: 'b', name: 'Alt (Bottom) Kuark', group: 'Kuark (3. Nesil)', mass: '4,18 GeV/c²', charge: '−1/3 e', spin: '1/2', color: '#e11d48', desc: 'B-mezonlarında CP simetri kırılmasını ve evrendeki madde-antimadde asimetrisini incelemek için kritik öneme sahiptir.' },
    // Leptonlar
    { id: 'e', sym: 'e⁻', name: 'Elektron', group: 'Lepton (1. Nesil)', mass: '0,511 MeV/c²', charge: '−1 e', spin: '1/2', color: '#00f2fe', desc: 'Atom orbitallerini dolduran ve tüm kimyasal bağları yöneten kararlı negatif yüklü temel leptondur.' },
    { id: 'mu', sym: 'μ⁻', name: 'Müon', group: 'Lepton (2. Nesil)', mass: '105,66 MeV/c²', charge: '−1 e', spin: '1/2', color: '#06b6d4', desc: 'Elektronun ~207 kat daha ağır kardeşidir. Üst atmosferde kozmik ışınlarla oluşur ve özel görelilik zaman genişlemesi sayesinde yeryüzüne ulaşır.' },
    { id: 'tau', sym: 'τ⁻', name: 'Tau Leptonu', group: 'Lepton (3. Nesil)', mass: '1776,86 MeV/c²', charge: '−1 e', spin: '1/2', color: '#0284c7', desc: 'Protondan bile ağır olan tek leptondur; çok kısa sürede (2,9×10⁻¹³ s) hadronlara veya daha hafif leptonlara bozunur.' },
    { id: 've', sym: 'νₑ', name: 'Elektron Nötrinosu', group: 'Lepton (1. Nesil)', mass: '< 0,8 eV/c²', charge: '0', spin: '1/2', color: '#38bdf8', desc: 'Beta bozunumlarında ve Güneş’teki nükleer füzyonda saniyede trilyonlarcası üretilen "hayalet" parçacıktır.' },
    { id: 'vmu', sym: 'ν_μ', name: 'Müon Nötrinosu', group: 'Lepton (2. Nesil)', mass: '< 0,19 MeV/c²', charge: '0', spin: '1/2', color: '#38bdf8', desc: 'Pion ve müon bozunumlarında ortaya çıkar; yol boyunca diğer nötrino çeşnilerine kuantum salınımı (oscillation) yapar.' },
    { id: 'vtau', sym: 'ν_τ', name: 'Tau Nötrinosu', group: 'Lepton (3. Nesil)', mass: '< 18,2 MeV/c²', charge: '0', spin: '1/2', color: '#38bdf8', desc: '2000 yılında Fermilab DONUT deneyinde doğrudan gözlemlenen 3. nesil nötrinodur.' },
    // Bozonlar
    { id: 'gamma', sym: 'γ', name: 'Foton', group: 'Ayar Bozonu (EM)', mass: '0', charge: '0', spin: '1', color: '#f59e0b', desc: 'Elektromanyetik kuvvetin kütlesiz kuantum taşıyıcısıdır; vakumda c = 299.792.458 m/s hızla yayılır.' },
    { id: 'gluon', sym: 'g', name: 'Gluon (8 Renk Durumu)', group: 'Ayar Bozonu (QCD)', mass: '0', charge: '0', spin: '1', color: '#a855f7', desc: 'Kuarkları birbirine "yapıştıran" güçlü nükleer kuvvet taşıyıcısıdır. Kendisi de renk yükü taşıdığı için kuark حپسine (confinement) yol açar.' },
    { id: 'WZ', sym: 'W± / Z⁰', name: 'W ve Z Bozonları', group: 'Ayar Bozonu (Zayıf)', mass: '80,4 / 91,2 GeV/c²', charge: '±1 e / 0', spin: '1', color: '#10b981', desc: 'Kuark çeşnisini değiştirerek radyoaktif Beta bozunumunu ve yıldızlardaki hidrojen füzyonunu sağlayan ağır ayar bozonlarıdır.' },
    { id: 'higgs', sym: 'H⁰', name: 'Higgs Bozonu', group: 'Skaler Bozon', mass: '125,25 GeV/c²', charge: '0', spin: '0', color: '#fde047', desc: '2012’de CERN LHC’de keşfedildi. Elektrozayıf simetri kırılmasıyla W/Z bozonlarına, kuarklara ve yüklü leptonlara kütle kazandırır.' },
  ];

  // Baryon (qqq) ve Mezon (qq̄) Sentez Veritabanı
  const HADRONS = {
    'duu': { sym: 'p⁺', name: 'Proton', type: 'Baryon (Nükleon)', charge: '+1 e', mass: 938.27, quarkMass: 9.0, spin: '1/2', halfLife: '∞ (Kararlı)', desc: 'Evrendeki görünür maddenin yapıtaşı. Kütlesinin %99’u 3 kuarkın durgun kütlesinden değil, QCD gluon alan enerjisinden (E = mc²) gelir!' },
    'ddu': { sym: 'n⁰', name: 'Nötron', type: 'Baryon (Nükleon)', charge: '0 e', mass: 939.57, quarkMass: 11.5, spin: '1/2', halfLife: '879,4 s (Serbest)', desc: 'Atom çekirdeklerini elektrostatik proton itmesine karşı bir arada tutan yüksüz nükleondur.' },
    'uuu': { sym: 'Δ⁺⁺', name: 'Delta-Artı-Artı', type: 'Baryon (Rezonans)', charge: '+2 e', mass: 1232.0, quarkMass: 6.5, spin: '3/2', halfLife: '5,6 × 10⁻²⁴ s', desc: 'Üç u kuarkının spinleri paraleldir (S=3/2). Pauli ilkesini ihlal etmemesi için Kırmızı-Yeşil-Mavi (QCD Renk Yükü) kavramının keşfini sağlamıştır!' },
    'ddd': { sym: 'Δ⁻', name: 'Delta-Eksi', type: 'Baryon (Rezonans)', charge: '−1 e', mass: 1232.0, quarkMass: 14.0, spin: '3/2', halfLife: '5,6 × 10⁻²⁴ s', desc: 'Üç aşağı (d) kuarktan oluşan spin-3/2 baryon rezonansıdır.' },
    'dsu': { sym: 'Λ⁰', name: 'Lambda Baryonu', type: 'Hiperon (Baryon)', charge: '0 e', mass: 1115.68, quarkMass: 100.2, spin: '1/2', halfLife: '2,63 × 10⁻¹⁰ s', desc: 'Bir garip (s) kuark içeren en hafif nötr hiperondur.' },
    'suu': { sym: 'Σ⁺', name: 'Sigma-Artı', type: 'Hiperon (Baryon)', charge: '+1 e', mass: 1189.37, quarkMass: 97.7, spin: '1/2', halfLife: '0,80 × 10⁻¹⁰ s', desc: 'İki yukarı ve bir garip kuarktan oluşan pozitif hiperondur.' },
    'dds': { sym: 'Σ⁻', name: 'Sigma-Eksi', type: 'Hiperon (Baryon)', charge: '−1 e', mass: 1197.45, quarkMass: 102.7, spin: '1/2', halfLife: '1,48 × 10⁻¹⁰ s', desc: 'İki aşağı ve bir garip kuarktan oluşan negatif hiperondur.' },
    'ssu': { sym: 'Ξ⁰', name: 'Ksi-Sıfır (Cascade)', type: 'Hiperon (Baryon)', charge: '0 e', mass: 1314.86, quarkMass: 189.0, spin: '1/2', halfLife: '2,90 × 10⁻¹⁰ s', desc: 'İki garip kuark içerdiği için basamaklı (cascade) olarak bozunur.' },
    'dss': { sym: 'Ξ⁻', name: 'Ksi-Eksi (Cascade)', type: 'Hiperon (Baryon)', charge: '−1 e', mass: 1321.71, quarkMass: 191.5, spin: '1/2', halfLife: '1,64 × 10⁻¹⁰ s', desc: 'Bir aşağı ve iki garip kuarktan oluşan negatif hiperondur.' },
    'sss': { sym: 'Ω⁻', name: 'Omega-Eksi Baryonu', type: 'Hiperon (Baryon)', charge: '−1 e', mass: 1672.45, quarkMass: 280.2, spin: '3/2', halfLife: '0,82 × 10⁻¹⁰ s', desc: 'Murray Gell-Mann’ın Sekizli Yol (SU(3)) kuramıyla kütlesini ve yükünü önceden tahmin ettiği, 1964’te keşfedilen efsanevi üç-garip kuarklı baryondur!' },
    // Mezonlar
    'u_dbar': { sym: 'π⁺', name: 'Pozitif Pion', type: 'Mezon (Kuark + Antikuark)', charge: '+1 e', mass: 139.57, quarkMass: 6.8, spin: '0', halfLife: '2,60 × 10⁻⁸ s', desc: 'Yukawa’nın öngördüğü, çekirdekte proton ve nötronlar arasındaki artık güçlü nükleer kuvveti taşıyan en hafif mezondur.' },
    'd_ubar': { sym: 'π⁻', name: 'Negatif Pion', type: 'Mezon (Kuark + Antikuark)', charge: '−1 e', mass: 139.57, quarkMass: 6.8, spin: '0', halfLife: '2,60 × 10⁻⁸ s', desc: 'Aşağı kuark (d) ve anti-yukarı kuarktan (ū) oluşan yüklü mezondur.' },
    'u_ubar': { sym: 'π⁰', name: 'Nötr Pion', type: 'Mezon (Kuark + Antikuark)', charge: '0 e', mass: 134.98, quarkMass: 4.3, spin: '0', halfLife: '8,5 × 10⁻¹⁷ s', desc: 'Elektromanyetik etkileşimle çok hızlı bir şekilde iki gama fotonuna (π⁰ → γ + γ) bozunur.' },
    'u_sbar': { sym: 'K⁺', name: 'Pozitif Kaon', type: 'Garip Mezon', charge: '+1 e', mass: 493.68, quarkMass: 95.6, spin: '0', halfLife: '1,24 × 10⁻⁸ s', desc: 'Anti-garip kuark (s̄) içeren ve parite ihlalinin (Lee & Yang) keşfinde başrol oynayan mezondur.' },
    's_ubar': { sym: 'K⁻', name: 'Negatif Kaon', type: 'Garip Mezon', charge: '−1 e', mass: 493.68, quarkMass: 95.6, spin: '0', halfLife: '1,24 × 10⁻⁸ s', desc: 'Garip kuark (s) ve anti-yukarı kuarktan (ū) oluşan mezondur.' },
  };

  // Fotoelektrik Etki Metalleri
  const PHOTO_METALS = [
    { id: 'na', name: 'Sodyum (Na)', W: 2.28, color: '#fbbf24' },
    { id: 'ca', name: 'Kalsiyum (Ca)', W: 2.87, color: '#38bdf8' },
    { id: 'zn', name: 'Çinko (Zn)', W: 4.33, color: '#94a3b8' },
    { id: 'cu', name: 'Bakır (Cu)', W: 4.70, color: '#f97316' },
    { id: 'pt', name: 'Platin (Pt)', W: 6.35, color: '#e2e8f0' },
  ];

  // ============================================================================
  // scienceWiki Ekosistem Standardı: Akademik Bilgi & Teori Veritabanı
  // ============================================================================
  const SCIENCE_WIKI = {
    mod1_1: {
      title: '3B Kuantum Atom, Küresel Harmonikler ve Atom Altı Katmanlar',
      intuitive: `Klasik fizikte elektronlar çekirdek etrafında gezegenler gibi belirli bir çizgide döner gibi düşünülürdü. Ancak kuantum mekaniğinde elektron noktasal bir bilye değil, uzaya yayılmış üç boyutlu bir <b>olasılık dalgasıdır ($\\psi$)</b>. Bir orbital, elektronun %90–95 olasılıkla bulunabileceği üç boyutlu hacmi ve dalga fazını (+/−) temsil eder. Çekirdeğe $10^5$ kat yaklaştığımızda ($10^{-15}\\text{ m}$) proton ve nötronları, onların da içine girdiğimizde kuarkları bir arada tutan <b>gluon akı tüplerini</b> görürüz.`,
      history: `<b>Niels Bohr (1913, Kopenhag)</b> açısal momentumu kuantize ederek ($L = n\\hbar$) ilk kuantum yörünge modelini kurdu. <b>Erwin Schrödinger (1926, Zürih)</b> dalga denklemini yazarak ($n, l, m_l$) kuantum sayılarını matematiksel özdeğerler olarak türetti. <b>Max Born (1926)</b> $|\\psi|^2$ büyüklüğünün olasılık yoğunluğu olduğunu gösterdi.`,
      formulas: [
        { tex: '\\psi_{nlm}(r,\\theta,\\phi) = R_{nl}(r) \\cdot Y_l^m(\\theta,\\phi)', desc: 'Hidrojen-benzeri atomun tam 3B dalga fonksiyonu; radyal Laguerre polinomu R_nl(r) ile küresel harmonik Y_l^m çarpımıdır.' },
        { tex: 'P(r) = 4\\pi r^2 |R_{nl}(r)|^2', desc: 'Radyal olasılık dağılım fonksiyonu: çekirdekten r uzaklığındaki ince küresel kabukta elektronu bulma olasılığı.' },
        { tex: 'R_{\\text{çekirdek}} = R_0 \\cdot A^{1/3} \\quad (R_0 \\approx 1{,}25\\text{ fm})', desc: 'Nükleer yarıçapın kütle numarası A’nın küpköküyle ölçeklenmesi (sabit nükleer yoğunluk).' }
      ],
      tasks: [
        { step: 'Görünüm modunu "Monte Carlo Bulutu (|ψ|²)" yapın, kuantum sayılarını n=3, l=2, m_l=0 (3d_z² orbitali) seçin ve iki lob ile ortadaki halka (torus) yapısını inceleyin.', preset: { sub: '1_1', n: 3, l: 2, ml: 0, viewMode: 'cloud' } },
        { step: 'Sağ paneldeki Radyal Dağılım Grafiğinde n=3, l=0 (3s) seçerek n−l−1 = 2 adet radyal düğüm noktasında (elektron olasılığının sıfırlandığı küresel kabuklar) dalganın sıfıra indiğini doğrulayın.', preset: { sub: '1_1', n: 3, l: 0, ml: 0, viewMode: 'slice' } },
        { step: 'Derinlik Zoom ölçeğini "3. Kuark & Gluon (<1 fm)" kademesine getirin ve proton içindeki 3 kuarkın (uud) QCD gluon tüpleriyle nasıl bağlandığını gözlemleyin.', preset: { sub: '1_1', zoomStage: 3 } }
      ]
    },
    mod1_2: {
      title: 'Tarihsel Atom Modelleri, Rutherford Saçılması ve Atomik Spektroskopi',
      intuitive: `Bir atomun içini mikroskopla göremeyiz; onun yerine atoma <b>Alfa ($\\alpha$) parçacıkları</b> veya <b>Fotonlar</b> fırlatıp nasıl saçıldıklarına ve hangi renk ışık yaydıklarına bakarız. Thomson'un "Üzümlü Kek" modelinde pozitif yük tüm atoma yayıldığı için alfa parçacıkları sapmadan geçer. Oysa Rutherford deneyinde alfa parçacıklarının büyük açılarla geri sekmesi, atomun kütlesinin ve pozitif yükünün merkezde minicik bir çekirdekte toplandığını kanıtlamıştır.`,
      history: `<b>Ernest Rutherford, Hans Geiger ve Ernest Marsden (1909–1911, Manchester Üniversitesi)</b> ince altın yaprağa alfa parçacıkları göndererek çekirdeği keşfetti. <b>Louis de Broglie (1924, Paris)</b> elektronun $2\\pi r = n\\lambda$ koşulunu sağlayan duran bir dalga olduğunu öne sürdü.`,
      formulas: [
        { tex: '\\vec{F}_{\\text{Coulomb}} = \\frac{1}{4\\pi\\varepsilon_0}\\frac{(2e)(Ze)}{r^2}\\hat{r}', desc: 'Alfa parçacığı (q₁ = +2e) ile atom çekirdeği (q₂ = +Ze) arasındaki elektrostatik itme kuvveti.' },
        { tex: '\\frac{1}{\\lambda} = R_H \\left(\\frac{1}{n_f^2} - \\frac{1}{n_i^2}\\right), \\quad E_n = -\\frac{13{,}6\\text{ eV}}{n^2}', desc: 'Rydberg formülü ve Bohr enerji seviyeleri: üst katmandan alt katmana inen elektronun yaydığı fotonun dalga boyu.' }
      ],
      tasks: [
        { step: 'Modeli "Thomson (1904)" seçip Alfa (α) Tabancasını ateşleyin: parçacıkların neredeyse hiç sapmadan geçtiğini görün.', preset: { sub: '1_2', model: 'thomson', gun: 'alpha' } },
        { step: 'Şimdi modeli "Rutherford (1911)" yapın: merkezdeki yoğun çekirdeğe yaklaşan alfa parçacıklarının Coulomb itmesiyle nasıl büyük açılarla sektiğini gözlemleyin.', preset: { sub: '1_2', model: 'rutherford', gun: 'alpha' } },
        { step: 'Modeli "Bohr (1913)" ve tabancayı "Foton Lazeri" seçin; alttaki Canlı Cam Spektrometrede Balmer serisi (656 nm kırmızı Hα, 486 nm mavi-yeşil Hβ) çizgilerinin oluşumunu izleyin.', preset: { sub: '1_2', model: 'bohr', gun: 'photon' } }
      ]
    },
    mod1_3: {
      title: 'Nükleer Fizik, Kütle Kusuru (Δmc²) ve Uranyum-235 Fisyonu',
      intuitive: `Bir atom çekirdeğindeki proton ve nötronları ayrı ayrı tartıp toplarsanız, oluşan çekirdeğin toplam kütlesinden <b>daha ağır</b> olduklarını görürsünüz! Kaybolan bu kütleye <b>Kütle Kusuru ($\\Delta m$)</b> denir; Einstein'ın $E_b = \\Delta m c^2$ bağıntısı uyarınca çekirdeği bir arada tutan devasa <b>Nükleer Bağlanma Enerjisine</b> dönüşmüştür.`,
      history: `<b>Lise Meitner ve Otto Hahn (1938, Berlin/Stockholm)</b> Uranyum çekirdeğinin nötron yakaladığında sıvı bir damla gibi uzayıp ikiye bölündüğünü (Nükleer Fisyon) keşfetti. <b>Enrico Fermi (1942, Chicago Pile-1)</b> kadmiyum kontrol çubuklarıyla ilk kontrollü zincirleme reaksiyonu gerçekleştirdi.`,
      formulas: [
        { tex: 'E_b = \\Delta m \\cdot c^2 = \\left(Z m_p + N m_n - M_{\\text{çekirdek}}\\right) \\cdot 931{,}494\\text{ MeV/u}', desc: 'Kütle kusuru Δm’nin MeV cinsinden toplam nükleer bağlanma enerjisine dönüşümü.' },
        { tex: '{}^{235}_{92}\\text{U} + {}^{1}_{0}n \\rightarrow {}^{236}_{92}\\text{U}^* \\rightarrow {}^{141}_{56}\\text{Ba} + {}^{92}_{36}\\text{Kr} + 3\\,{}^{1}_{0}n + 200\\text{ MeV}', desc: 'Termal nötronla tetiklenen Uranyum-235 fisyon reaksiyonu.' }
      ],
      tasks: [
        { step: 'Karbon-14 (Z=6, N=8) izotopunu seçin ve "Bozunumu Tetikle" butonuna basarak bir nötronun protona dönüşüp β⁻ elektronu fırlatarak kararlı Azot-14’e (Z=7, N=7) geçişini izleyin.', preset: { sub: '1_3', Z: 6, N: 8 } },
        { step: 'Demir-56 (Z=26, N=30) izotopunu seçerek nükleon başına bağlanma enerjisinin (~8,8 MeV/nükleon) zirveye ulaştığını doğrulayın.', preset: { sub: '1_3', Z: 26, N: 30 } },
        { step: 'Uranyum-235 Fisyon Reaktörü moduna geçip kontrol çubuklarını %20’ye çekin ve termal nötron ateşleyerek zincirleme reaksiyonu başlatın!', preset: { sub: '1_3', fissionMode: true, rodPct: 20 } }
      ]
    },
    mod1_4: {
      title: 'Standart Model ve QCD Kuark-Gluon Sentezleyici',
      intuitive: `Proton ve nötron temel parçacık değildir; içlerinde <b>Kuark</b> adı verilen kesirli elektrik yüklü ($+2/3e$ ve $-1/3e$) parçacıklar bulunur. Kuantum Renk Dinamiği (QCD) kurallarına göre doğada serbest kuark bulunamaz; yalnızca renk yüklerinin toplamı <b>"Beyaz (Renk Teklisi)"</b> olan üçlü kuarklar (<b>Baryon: Kırmızı+Yeşil+Mavi</b>) veya kuark-antikuark çiftleri (<b>Mezon: Renk+Antirenk</b>) var olabilir.`,
      history: `<b>Murray Gell-Mann ve George Zweig (1964, Caltech / CERN)</b> kuark modelini kurdu. 1968'de SLAC derin esnek olmayan saçılma deneyleriyle proton içindeki noktasal kuarklar doğrudan gözlemlendi.`,
      formulas: [
        { tex: 'Q_{\\text{proton}} = q_u + q_u + q_d = \\frac{2}{3}e + \\frac{2}{3}e - \\frac{1}{3}e = +1e', desc: 'Protonun (uud) kesirli kuark yüklerinin toplamından tam +1e yükünün elde edilmesi.' },
        { tex: 'm_p \\approx \\sum m_q\\;(\\approx 9\\text{ MeV},\\;\\%1) + \\frac{E_{\\text{gluon + kinetik}}}{c^2}\\;(\\approx 929\\text{ MeV},\\;\\%99)', desc: 'Proton kütlesinin %99’unun Higgs mekanizmasından değil, QCD gluon alanı bağlanma enerjisinden gelmesi.' }
      ],
      tasks: [
        { step: 'Baryon (3 Kuark) modunda slotlara iki Yukarı (u) ve bir Aşağı (d) kuark yerleştirerek Proton (p⁺, 938,3 MeV) sentezleyin ve kütle kökeni grafiğini inceleyin.', preset: { sub: '1_4', mode: 'baryon', q1: 'u', q2: 'u', q3: 'd' } },
        { step: 'Üç slota da Garip (s) kuark yerleştirerek Gell-Mann’ın öngördüğü efsanevi Omega-Eksi (Ω⁻, 1672 MeV) hiperonunu sentezleyin.', preset: { sub: '1_4', mode: 'baryon', q1: 's', q2: 's', q3: 's' } },
        { step: 'Mezon (Kuark + Antikuark) moduna geçip u ve d̄ seçerek nükleer kuvvet taşıyıcısı Pozitif Pion (π⁺) oluşturun.', preset: { sub: '1_4', mode: 'meson', q1: 'u', q2: 'dbar' } }
      ]
    },
    mod2_1: {
      title: 'Wilson Bulut Odası (Cloud Chamber) ve Radyoaktif Parçacık İzleri',
      intuitive: `Çıplak gözle göremediğimiz alfa, beta ve kozmik müon parçacıklarını nasıl görünür kılarız? Aşırı soğutulmuş ve aşırı doymuş alkol buharı içinden geçen yüklü bir parçacık, yol üzerindeki gaz atomlarından elektron kopararak <b>iyonlar</b> bırakır. Alkol buharı bu iyonların etrafında anında yoğuşarak tıpkı uçakların gökyüzünde bıraktığı beyaz izler gibi yoğunlaşma izleri oluşturur!`,
      history: `<b>Charles Thomson Rees Wilson (1911, Cambridge Cavendish Laboratuvarı)</b> İskoçya'daki Ben Nevis dağında bulut oluşumunu incelerken bulut odasını icat etti ve 1927 Nobel Fizik Ödülü'nü kazandı. <b>Carl Anderson (1932)</b> manyetik alanlı bulut odasında ters yöne bükülen izi görerek ilk antimadde parçacığı olan <b>Pozitronu ($e^+$)</b> keşfetti.`,
      formulas: [
        { tex: '\\vec{F}_L = q(\\vec{v} \\times \\vec{B}) \\implies r = \\frac{\\gamma m v}{|q| B}', desc: 'Manyetik alanda hareket eden yüklü parçacığın Lorentz kuvveti altında çizdiği yörüngenin eğrilik yarıçapı (siklotron yarıçapı).' }
      ],
      tasks: [
        { step: 'Kaynağı "Amerikyum-241 (Alfa)" seçin: ağır ve +2e yüklü alfa parçacıklarının bıraktığı kısa, kalın ve düz yoğunlaşma izlerini gözlemleyin.', preset: { sub: '2_1', source: 'alpha', B: 0 } },
        { step: 'Kaynağı "Stronsiyum-90 / Na-22 (Beta e⁻ / Pozitron e⁺)" seçin ve Manyetik Alanı B = 1,5 Tesla’ya çıkarın: elektronların ve pozitronların zıt yönlere spiral çizerek büküldüğünü görün!', preset: { sub: '2_1', source: 'beta', B: 1.5 } }
      ]
    },
    mod2_2: {
      title: 'J.J. Thomson Katot Işını Tüpü ve Elektronun Keşfi (e/m)',
      intuitive: `Vakumlu cam tüpte katottan kopup anoda hızla giden ışın demetinin ne olduğunu anlamak için onu hem <b>Elektrik Alan ($\\vec{E}$)</b> hem de <b>Manyetik Alan ($\\vec{B}$)</b> içinden geçiririz. Elektrik ve manyetik kuvvetleri birbirini tam sıfırlayacak şekilde ayarladığımızda ($qE = qvB$), ışının hızını ($v = E/B$) ve ardından saptırma yarıçapından elektronun yük/kütle oranını ($e/m$) kusursuzca ölçeriz.`,
      history: `<b>J.J. Thomson (1897, Cambridge Cavendish Laboratuvarı)</b> katot ışınlarının hidrojen iyonundan ~1836 kat daha hafif negatif yüklü parçacıklar ("korpüsküller", yani elektronlar) olduğunu kanıtlayarak atomun bölünmezliği fikrini yıktı.`,
      formulas: [
        { tex: 'v = \\frac{E}{B} \\quad (\\text{Wien Hız Seçici Dengesi: } F_E = F_B)', desc: 'Elektrik ve manyetik kuvvetler eşitlendiğinde demetin sapmadan düz gitme hızı.' },
        { tex: '\\frac{e}{m} = \\frac{2 V_{\\text{hız}}}{B^2 r^2} \\approx 1{,}7588 \\times 10^{11}\\text{ C/kg}', desc: 'Elektronun özgül yükünün (yük/kütle oranı) manyetik eğrilik yarıçapından hesabı.' }
      ],
      tasks: [
        { step: 'Elektrik alanı E = 0 iken Manyetik Alanı B = 1,2 mT yapın ve yeşil floresan elektron demetinin Lorentz kuvvetiyle aşağı/yukarı büküldüğünü görün.', preset: { sub: '2_2', E: 0, B: 1.2 } },
        { step: '"Hız Seçici (Wien Dengesi) Kur" butonuna basarak F_E = F_B dengesini sağlayın ve ışının tekrar tam merkeze (sıfır sapma) oturduğunu doğrulayın.', preset: { sub: '2_2', balance: true } }
      ]
    },
    mod2_3: {
      title: 'Einstein Fotoelektrik Etki Cam Hücresi ve Işığın Kuantum Doğası',
      intuitive: `Klasik dalga teorisine göre ışığın şiddetini (parlaklığını) yeterince artırırsanız her renkteki ışık metalden elektron koparabilmeliydi. Oysa deneyler gösterdi ki: ışığın frekansı metalin <b>eşik frekansından ($f_0$)</b> küçükse, ışık ne kadar parlak olursa olsun <b>tek bir elektron bile kopmaz!</b> Çünkü ışık enerji paketlerinden (<b>fotonlardan, $E = hf$</b>) oluşur ve bir elektronu yalnızca tek bir foton sökebilir.`,
      history: `<b>Heinrich Hertz (1887)</b> ve <b>Philipp Lenard (1902)</b> olayı deneysel olarak gözlemledi; <b>Albert Einstein (1905, Bern)</b> ışığın kuantumlu fotonlardan oluştuğunu açıklayarak 1921 Nobel Fizik Ödülü'nü kazandı.`,
      formulas: [
        { tex: 'E_{\\text{foton}} = h f = \\frac{hc}{\\lambda}, \\qquad E_{k,\\max} = h f - W = e V_0', desc: 'Einstein fotoelektrik denklemi: kopan elektronun maksimum kinetik enerjisi, foton enerjisi eksi metalin bağlanma enerjisidir (iş fonksiyonu W).' }
      ],
      tasks: [
        { step: 'Metali "Çinko (W = 4,33 eV)" seçin, dalga boyunu 550 nm (Yeşil) yapın ve ışık şiddetini %100’e çıkarın: elektron kopmadığını (I = 0 μA) görün!', preset: { sub: '2_3', metal: 'zn', lambda: 550, intensity: 100, V: 0 } },
        { step: 'Şimdi dalga boyunu 240 nm (Morötesi / UV) altına indirin: foton enerjisi eşiği aştığı anda fotoelektronların fırladığını ve akımın başladığını gözlemleyin.', preset: { sub: '2_3', metal: 'zn', lambda: 220, intensity: 80, V: 0 } },
        { step: 'Batarya gerilimini negatif yönde durdurma potansiyeline (V = −V₀) çekerek en hızlı elektronları bile durdurun.', preset: { sub: '2_3', metal: 'na', lambda: 350, intensity: 80, stopV: true } }
      ]
    },
    mod2_4: {
      title: 'Millikan Yağ Damlası Mikroskop Vizörü ve Yükün Kuantizasyonu',
      intuitive: `Mikroskobik bir yağ damlacığını iki paralel metal plaka arasına püskürttüğümüzde damlacık yerçekimiyle aşağı düşer. Plakalara voltaj uyguladığımızda ise yüklü damlacığa yukarı doğru elektriksel kuvvet ($qE$) etki eder. Voltajı damlacık havada <b>tam asılı kalacak</b> şekilde ayarladığımızda ($qE = mg$), damlacığın üzerindeki elektrik yükünü ölçeriz ve tüm yüklerin $e = 1{,}602 \\times 10^{-19}\\text{ C}$ değerinin tam katları olduğunu keşfederiz!`,
      history: `<b>Robert Andrews Millikan ve Harvey Fletcher (1909–1913, Chicago Üniversitesi Ryerson Laboratuvarı)</b> bu deneyle temel elektron yükünü %1'den yüksek hassasiyetle ölçtü (1923 Nobel Fizik Ödülü).`,
      formulas: [
        { tex: 'F_e = F_g \\implies q \\frac{V}{d} = m g \\implies q = \\frac{m g d}{V} = n \\cdot e', desc: 'Elektriksel kuvvet yerçekimini dengelediğinde yağ damlasının yükü q ve temel yük e’nin tam katları.' }
      ],
      tasks: [
        { step: '"Yeni Yağ Damlası Püskürt" butonuna basın ve mikroskop vizöründe aşağı düşen damlacığı izleyin.', preset: { sub: '2_4', newDrop: true } },
        { step: '"🎯 Otomatik Askıda Dengele (F_e = F_g)" butonuna basarak veya voltaj kaydırıcısını ayarlayarak damlacığı vizör merkezinde sıfır hızla durdurun ve q = n·e tam katını okuyun.', preset: { sub: '2_4', autoBalance: true } }
      ]
    },
    mod3_1: {
      title: 'Serbest Cisim Diyagramı (FBD), Newton Dinamiği ve Kinematik',
      intuitive: `Bir cismin nasıl hareket edeceğini bulmanın sırrı, cismin üzerine etki eden tüm kuvvetleri ($\vec{F}_g, \vec{N}, \vec{f}, \vec{T}$) <b>Serbest Cisim Diyagramı (FBD)</b> üzerinde bileşenlerine ayırmaktır. Newton'un 2. Yasası ($\sum \vec{F} = m\vec{a}$) her an ivmeyi belirler.`,
      history: `<b>Galileo Galilei (1638)</b> eğik düzlem deneyleriyle ivmeli hareket yasalarını keşfetti; <b>Sir Isaac Newton (1687, Principia Mathematica)</b> üç hareket yasasıyla klasik mekaniğin temellerini attı.`,
      formulas: [
        { tex: 'm a = F_{\\text{uyg}} + m g \\sin\\theta - \\mu_k m g \\cos\\theta', desc: 'Eğik düzlem üzerinde hareket eden bloğun net ivme denklemi.' },
        { tex: 'a = \\frac{m_2 - m_1}{m_1 + m_2}g, \\qquad T = \\frac{2 m_1 m_2}{m_1 + m_2}g', desc: 'Atwood makara düzeneğinde sistemin ivmesi ve ip gerilmesi.' }
      ],
      tasks: [
        { step: 'Eğik düzlem senaryosunda açıyı θ = 30° ve sürtünmeyi μ = 0,20 yapıp kuvvet vektörlerinin (mg·sinθ, mg·cosθ, N, f_k) değişimini inceleyin.', preset: { sub: '3_1', scene: 'incline', angle: 30, mu: 0.2 } },
        { step: 'Atwood Makarası senaryosuna geçip m₁ = 3 kg, m₂ = 6 kg seçerek ivme ve ip gerilmesi vektörlerini gözlemleyin.', preset: { sub: '3_1', scene: 'atwood', angle: 25, mu: 0.1 } }
      ]
    },
    mod3_2: {
      title: 'Kaos Teorisi, Çift Sarkaç, Kapitza Sarkacı ve RK4 Çözücü',
      intuitive: `Doğrusal olmayan (nonlinear) sistemlerde hareket denklemleri tamamen deterministik (kesin) olsa bile, başlangıç koşullarındaki <b>binde birlik ($0{,}001^\\circ$) bir fark</b> bile saniyeler içinde üstel olarak büyüyerek bambaşka yörüngelere yol açar. Buna <b>Kelebek Etkisi (Deterministik Kaos)</b> denir. Öte yandan, düşeyde hızla titreşen bir ters sarkaç (Kapitza sarkacı), şaşırtıcı biçimde baş aşağı tepe noktasında kararlı dengede durabilir!`,
      history: `<b>Henri Poincaré (1890)</b> 3-cisim probleminde kaosu ilk fark eden matematikçi oldu. <b>Edward Lorenz (1963, MIT)</b> kelebek etkisini tanımladı; <b>Pyotr Kapitza (1951, Moskova)</b> titreşimli ters sarkacın efektif potansiyel teorisini kurdu.`,
      formulas: [
        { tex: 'y_{n+1} = y_n + \\frac{\\Delta t}{6}\\left(k_1 + 2k_2 + 2k_3 + k_4\\right) \\quad (\\text{RK4 Çözücü})', desc: 'Enerji kaymasını (drift) önleyen 4. dereceden Runge-Kutta sayısal integrasyon şeması.' },
        { tex: '|\\Delta \\theta(t)| \\approx |\\Delta \\theta_0| \\, e^{\\lambda t}', desc: 'Kaotik sistemde komşu iki yörüngenin Lyapunov üssü λ ile üstel ıraksaması.' }
      ],
      tasks: [
        { step: 'Çift Sarkaç modunda "🦋 Kelebek Etkisi Hayalet Sarkacı (Δθ = 0,001°)" seçeneğini açık tutun ve θ₁ = 135°’den bırakılan iki sarkacın birkaç saniye sonra nasıl tamamen ayrıldığını izleyin!', preset: { sub: '3_2', sys: 'double', th1: 135, th2: 120, ghost: true } },
        { step: 'Sistemi "Kapitza (Ters) Sarkacı" seçin: hızlı düşey titreşimin baş aşağı duran sarkacı düşürmeden nasıl kararlı dengede tuttuğunu görün!', preset: { sub: '3_2', sys: 'kapitza' } }
      ]
    },
    mod4_1: {
      title: 'Elektrostatik/Manyetostatik Alan Kum Havuzu ve Lorentz Yörüngeleri',
      intuitive: `Uzaydaki her elektrik yükü etrafındaki uzayı değiştirerek bir <b>Elektrik Alan ($\vec{E}$)</b> ve skaler bir <b>Potansiyel Tepesi/Çukuru ($V$)</b> oluşturur. Pozitif yükler potansiyel tepeleri (kırmızı), negatif yükler ise potansiyel kuyuları (mavi) gibidir. Bu alana fırlatılan yüklü bir test parçacığı hem elektrik alandan hem de dik manyetik alandan ($\vec{B}$) kaynaklanan <b>Lorentz Kuvveti</b> ile siklotron spiralleri çizer.`,
      history: `<b>Charles-Augustin de Coulomb (1785)</b> ters-kare kuvvet yasasını buldu; <b>Michael Faraday</b> alan çizgileri kavramını geliştirdi; <b>Hendrik Lorentz (1895)</b> elektromanyetik kuvvet denklemini formüle etti.`,
      formulas: [
        { tex: '\\vec{E}(\\vec{r}) = \\frac{1}{4\\pi\\varepsilon_0}\\sum_i \\frac{q_i}{|\\vec{r}-\\vec{r}_i|^3}(\\vec{r}-\\vec{r}_i), \\qquad V(\\vec{r}) = \\frac{1}{4\\pi\\varepsilon_0}\\sum_i \\frac{q_i}{|\\vec{r}-\\vec{r}_i|}', desc: 'Noktasal yük dağılımının oluşturduğu süperpozisyon elektrik alanı ve eşpotansiyel skaler alanı.' },
        { tex: '\\vec{F} = q\\left(\\vec{E} + \\vec{v} \\times \\vec{B}\\right)', desc: 'Yüklü parçacığa etkiyen tam elektromanyetik Lorentz kuvveti.' }
      ],
      tasks: [
        { step: '"Dipol (+q / −q) Kur" hazır sahnesini seçin ve eşpotansiyel ısı haritası ile elektrik alan vektörlerini inceleyin.', preset: { sub: '4_1', preset: 'dipole' } },
        { step: 'Manyetik alanı B_z = 1,2 T yapıp "🚀 Yüklü Test Parçacığı Fırlat" butonuna basın ve parçacığın Lorentz kuvvetiyle çizdiği yörüngeyi izleyin.', preset: { sub: '4_1', launch: true, Bz: 1.2 } }
      ]
    },
    mod4_2: {
      title: 'Faraday Elektromanyetik İndüksiyonu, Lenz Yasası ve AC Jeneratör',
      intuitive: `Durgun bir mıknatıs bir bakır bobinin içinde dursa bile <b>hiçbir akım üretmez!</b> Elektrik üretmenin tek şartı manyetik akının <b>zamanla değişmesidir ($d\\Phi_B/dt \\neq 0$)</b>. Mıknatısı bobine ne kadar hızlı sokup çıkarırsanız, bobindeki serbest elektronlar o kadar güçlü itilir, lamba o kadar parlak yanar ve alternatif akım (AC) oluşur.`,
      history: `<b>Michael Faraday (1831, Royal Institution Londra)</b> ve <b>Joseph Henry</b> elektromanyetik indüksiyonu keşfederek modern elektrik şebekelerinin ve jeneratörlerin temelini attı. <b>Heinrich Lenz (1834)</b> indüksiyon akımının kendisini doğuran değişime karşı koyduğunu (eksi işaretini) açıkladı.`,
      formulas: [
        { tex: '\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}, \\qquad \\Phi_B = \\int \\vec{B} \\cdot d\\vec{A}', desc: 'Faraday-Lenz elektromanyetik indüksiyon yasası: sarım sayısı N ile manyetik akı değişim hızının çarpımı.' }
      ],
      tasks: [
        { step: 'Mıknatısı fareyle/dokunmatikle yakalayıp bobinin içinden hızla geçirin; durduğunuz anda EMK’nın sıfırlandığını, hızlı hareket ettirdiğinizde lambanın parladığını görün.', preset: { sub: '4_2', autoGen: false } },
        { step: '"⚡ Otomatik AC Jeneratör Tahriki" modunu açıp sarım sayısını N = 8’e çıkarın ve sağdaki osiloskopta oluşan sinüzoidal AC gerilim dalgasını inceleyin.', preset: { sub: '4_2', autoGen: true, turns: 8 } }
      ]
    },
    mod5_1: {
      title: 'Geometrik Optik, Mercekler ve Cauchy Dispersiyon Prizması',
      intuitive: `Işık vakumdan cama girdiğinde yavaşlar ve doğrultusunu değiştirir (<b>Snell Kırılma Yasası</b>). Üstelik camın kırılma indisi ($n$) ışığın dalga boyuna bağlıdır (<b>Cauchy Denklemi</b>): mor ışık ($380\\text{ nm}$) cam içinde kırmızı ışıktan ($700\\text{ nm}$) daha yavaş ilerler ve daha fazla kırılır. Bu yüzden beyaz ışık prizmadan geçtiğinde gökkuşağı renklerine ayrılır!`,
      history: `<b>İbnü'l-Heysem (Alhazen, 1011)</b> Kitâbü'l-Menâzır ile deneysel optiği kurdu; <b>Willebrord Snellius (1621)</b> kırılma yasasını buldu; <b>Isaac Newton (1666)</b> prizmayla beyaz ışığın tüm spektrum renklerinin birleşimi olduğunu kanıtladı.`,
      formulas: [
        { tex: 'n_1 \\sin\\theta_1 = n_2(\\lambda) \\sin\\theta_2, \\qquad n(\\lambda) = A + \\frac{B}{\\lambda^2}', desc: 'Snell kırılma yasası ve dalga boyuna bağlı Cauchy dispersiyon (renk ayrımı) bağıntısı.' }
      ],
      tasks: [
        { step: 'Optik düzeneği "Cauchy Dispersiyon Prizması" ve ışığı "Beyaz Işık (Gökkuşağı Spektrumu)" seçin; dispersiyon katsayısını artırarak renklerin ayrılma açısını genişletin.', preset: { sub: '5_1', element: 'prism', whiteLight: true } },
        { step: 'Düzeneği "Fiber Optik Kablo (Tam İç Yansıma)" seçin ve lazer ışınının kritik açıyı aşarak cam fiber içinde nasıl kayıpsız ilerlediğini gözlemleyin.', preset: { sub: '5_1', element: 'fiber' } }
      ]
    },
    mod5_2: {
      title: 'Young & Tonomura Kuantum Çift Yarık, Kuantum Silgi ve Aharonov-Bohm Deneyi',
      intuitive: `İki dar yarıktan geçen dalgalar birbirleriyle üst üste binerek ekran üzerinde aydınlık (yapıcı girişim) ve karanlık (yıkıcı girişim) saçaklar oluşturur. Peki yarıklara dalga değil de <b>tek tek elektronlar</b> veya <b>720 atomik kütle birimli dev Fulleren ($\text{C}_{60}$) molekülleri</b> gönderirsek ne olur? İlk parçacıklar ekrana rastgele noktacıklar gibi düşer; ancak binlerce parçacık biriktiğinde her bir parçacık <b>kendi kendisiyle girişim yaparak</b> $|\psi_1 + \psi_2|^2$ kuantum saçaklarını örer! <b>Hangi-Yol Dedektörü</b> açıldığında dalga fonksiyonu çöker; ancak <b>Kuantum Silgi (Quantum Eraser)</b> hangi-yol bilgisini sildiğinde girişim saçakları mucizevi biçimde geri döner!`,
      history: `<b>Thomas Young (1801)</b> çift yarık deneyini ışıkla yaptı; <b>Akira Tonomura (1989, Hitachi Lab)</b> tek elektronlarla çift yarık girişimini nokta nokta görüntüledi; <b>Anton Zeilinger (1999, Viyana)</b> $\text{C}_{60}$ Buckyball dev molekülleriyle madde-dalgası girişimini kanıtladı; <b>Yakir Aharonov & David Bohm (1959)</b> manyetik alanın sıfır olduğu bölgede vektör potansiyeli $\vec{A}$'nın girişim saçaklarını kaydırdığını gösterdi.`,
      formulas: [
        { tex: 'I(y) = |\\psi_1 + \\psi_2|^2 = I_0 \\cos^2\\!\\left(\\frac{\\pi d y}{\\lambda L} + \\frac{\\Delta\\varphi_{\\text{AB}}}{2}\\right)\\left(\\frac{\\sin\\alpha}{\\alpha}\\right)^2', desc: 'Çift yarık kuantum olasılık yoğunluğu, kırınım zarfı ve Aharonov-Bohm faz kayması.' },
        { tex: '\\Delta\\varphi_{\\text{AB}} = \\frac{e}{\\hbar}\\oint \\vec{A}\\cdot d\\vec{l} = 2\\pi \\frac{\\Phi_B}{\\Phi_0}, \\qquad \\lambda_{\\text{dB}} = \\frac{h}{p}', desc: 'Aharonov-Bohm topolojik kuantum faz kayması ve De Broglie madde dalga boyu.' }
      ],
      tasks: [
        { step: 'Tonomura Tek-Tek (Nokta) modunda elektronların ekranda nokta nokta girişim saçaklarını örmesini izleyin.', preset: { sub: '5_2', mode: 'quantum', detector: false, eraser: false } },
        { step: '"👁️ Hangi-Yol Lazer Dedektörü"nü açıp saçakların 2 klasik banda çöktüğünü görün; ardından "🔮 Kuantum Silgi"yi açarak girişim saçaklarını geri getirin!', preset: { sub: '5_2', mode: 'quantum', detector: true, eraser: true } },
        { step: 'Görünümü "3B Dalga & Ekran Duvarı" yapıp Aharonov-Bohm Solenoid Akısını Φ_B = 0,50 Φ₀ değerine getirerek saçakların kaymasını inceleyin.', preset: { sub: '5_2', mode: 'iso3d', abFlux: 0.5 } }
      ]
    },
    mod5_3: {
      title: 'Stern-Gerlach Spin Kuantizasyonu, Mach-Zehnder & Davisson-Germer Deneyleri',
      intuitive: `Çift yarık deneyinin kardeşleri olan bu üç temel kuantum deneyi klasik fiziğin sınırlarını yıkar: <b>1) Stern-Gerlach (1922):</b> Homojen olmayan manyetik alandan geçen gümüş atomları klasik beklenti olan sürekli şerit yerine yalnızca <b>2 ayrık lekeye ($m_s = \\pm 1/2$)</b> ayrılır! <b>2) Mach-Zehnder & Wheeler Gecikmeli Seçim:</b> Tek bir foton iki koldan süperpozisyon halinde gider; 2. yarı-geçirgen aynayı (BS₂) takıp takmamaya foton ilk aynayı geçtikten <b>sonra</b> karar verseniz bile foton sanki geleceği biliyormuş gibi dalga veya parçacık davranışına geçer! <b>3) Davisson-Germer (1927):</b> Nikel kristaline çarpan elektronlar tıpkı X-ışınları gibi Bragg kırınımı ($n\\lambda = 2d\\sin\\theta$) yapar.`,
      history: `<b>Otto Stern & Walther Gerlach (1922, Frankfurt)</b> uzaysal spin kuantizasyonunu keşfetti; <b>Clinton Davisson & Lester Germer (1927, Bell Labs)</b> elektronun madde dalgası olduğunu kanıtladı; <b>John Archibald Wheeler (1978)</b> gecikmeli seçim (delayed-choice) deneyini tasarladı.`,
      formulas: [
        { tex: 'F_z = \\mu_z \\frac{\\partial B_z}{\\partial z} = -g_s \\mu_B \\frac{m_s}{\\hbar} S_z \\frac{\\partial B_z}{\\partial z}, \\qquad m_s = \\pm \\frac{1}{2}', desc: 'Stern-Gerlach deneyinde spin-1/2 parçacığına etkiyen kuantize manyetik sapma kuvveti.' },
        { tex: 'P(D_1) = \\cos^2\\!\\left(\\frac{\\Delta\\varphi}{2}\\right), \\quad P(D_2) = \\sin^2\\!\\left(\\frac{\\Delta\\varphi}{2}\\right), \\qquad n\\lambda_{\\text{dB}} = 2d\\sin\\theta', desc: 'Mach-Zehnder tek foton girişim olasılıkları ve Davisson-Germer Bragg kırınım şartı.' }
      ],
      tasks: [
        { step: 'Stern-Gerlach modunda "Ardışık 3 Filtre: SG_z(+) → SG_x(+) → SG_z" seçeneğini açın: X-ekseni spin ölçümünün Z-ekseni hafızasını nasıl sıfırladığını görün!', preset: { sub: '5_3', expType: 'sterngerlach', sgMode: 'sequential' } },
        { step: 'Mach-Zehnder & Wheeler Gecikmeli Seçim moduna geçip BS₂ aynasını çıkarıp takarak tek fotonun parçacık (%50-%50) ve dalga (%100-%0) rejimleri arasındaki geçişini test edin.', preset: { sub: '5_3', expType: 'machzehnder' } }
      ]
    },
    mod6_1: {
      title: 'Maxwell-Boltzmann İdeal Gaz Odası ve Maxwell’in Cini (Entropi)',
      intuitive: `Bir gazın sıcaklığı ($T$) aslında onu oluşturan moleküllerin ortalama öteleme kinetik enerjisinin bir ölçüsüdür. Ancak tüm moleküller aynı hızda gitmez; çarpışmalar sonucunda hızlar <b>Maxwell-Boltzmann dağılım eğrisine</b> uyar. <b>Maxwell'in Cini</b> düşünce deneyinde ise iki oda arasındaki akıllı bir kapı hızlı (sıcak) molekülleri sağa, yavaş (soğuk) molekülleri sola geçirerek dışarıdan iş yapmadan entropiyi azaltmaya çalışır!`,
      history: `<b>James Clerk Maxwell (1860, 1867)</b> hız dağılım yasasını ve "Maxwell'in Cini" düşünce deneyini ortaya attı; <b>Ludwig Boltzmann (1877)</b> istatistiksel entropi denklemini ($S = k_B \\ln\\Omega$) mezar taşına kazınacak şekilde formüle etti.`,
      formulas: [
        { tex: 'P V = N k_B T, \\qquad f(v) = 4\\pi v^2 \\left(\\frac{m}{2\\pi k_B T}\\right)^{3/2} e^{-\\frac{m v^2}{2 k_B T}}', desc: 'İdeal gaz durum denklemi ve Maxwell-Boltzmann moleküler hız olasılık yoğunluğu.' },
        { tex: 'S = k_B \\ln \\Omega', desc: 'Boltzmann entropi formülü: makroskopik duruma karşılık gelen mikro-durum sayısı Ω.' }
      ],
      tasks: [
        { step: 'Sıcaklığı T = 150 K’den 800 K’e çıkarın: sağdaki Maxwell-Boltzmann hız histogramının nasıl sağa kayıp yayvanlaştığını gözlemleyin.', preset: { sub: '6_1', T: 800, demon: false } },
        { step: '"😈 Maxwell’in Cini Kapısını Aç" modunu etkinleştirin: hızlı (kırmızı) moleküllerin sağ odaya, yavaş (mavi) moleküllerin sol odaya ayrılarak ΔT sıcaklık farkı oluşturmasını izleyin!', preset: { sub: '6_1', T: 400, demon: true } }
      ]
    },
    mod6_2: {
      title: 'Bernoulli Akışkanlar Tüneli ve Uçak Kanadı (Airfoil) Kaldırma Kuvveti',
      intuitive: `Sıkıştırılamaz bir akışkan daralan bir boru kesitine girdiğinde, birim zamanda aynı miktarda sıvının geçebilmesi için <b>hızlanmak</b> zorundadır (Süreklilik Denklemi). <b>Bernoulli İlkesi</b> uyarınca akışkanın hızlandığı yerde statik basıncı düşer! Uçak kanadının (airfoil) üst yüzeyinde hava daha hızlı aktığı için üst basınç düşer ve kanadı yukarı kaldıran net <b>Aerodinamik Kaldırma Kuvveti ($\vec{F}_{\\text{lift}}$)</b> doğar.`,
      history: `<b>Daniel Bernoulli (1738, Hydrodynamica)</b> akışkan hızı ile basınç arasındaki enerji korunumu yasasını yayımladı; <b>Giovanni Battista Venturi (1797)</b> daralan boru etkisini keşfetti.`,
      formulas: [
        { tex: 'A_1 v_1 = A_2 v_2, \\qquad P_1 + \\frac{1}{2}\\rho v_1^2 = P_2 + \\frac{1}{2}\\rho v_2^2 = \\text{sabit}', desc: 'Hacimsel debi süreklilik denklemi ve Bernoulli akışkan enerji korunumu.' }
      ],
      tasks: [
        { step: 'Venturi Borusu modunda dar boğaz çapını küçültün ve boğazdan geçen akışkan parçacıklarının hızlanırken manometre basınç sütununun nasıl düştüğünü görün.', preset: { sub: '6_2', mode: 'venturi', throat: 0.42 } },
        { step: 'Modu "Uçak Kanadı (Airfoil)" yapıp hücum açısını (α = 10°) artırın ve kanat üzerindeki kaldırma kuvveti vektörünü inceleyin.', preset: { sub: '6_2', mode: 'airfoil', aoa: 10 } }
      ]
    },
    mod7_1: {
      title: 'Einstein Özel Görelilik (Special Relativity) ve Foton Işık Saati',
      intuitive: `Işık hızı ($c$) tüm gözlemciler için mutlak ve sabittir! Bir uzay aracı ışık hızına yaklaşırken içindeki dikey <b>Foton Işık Saati</b>ne dışarıdan (Dünya'dan) bakan bir gözlemci, fotonun çapraz (zikzak) daha uzun bir yol kat ettiğini görür. Işık hızı değişemeyeceğine göre, hareket eden aracın <b>zamanı yavaşlamalı</b> (Zaman Genişlemesi) ve hareket doğrultusundaki <b>boyu kısalmalıdır</b> (Lorentz Boy Kısalması)!`,
      history: `<b>Albert Einstein (1905, "Hareketli Cisimlerin Elektrodinamiği Üzerine")</b> mutlak uzay ve mutlak zaman kavramlarını yıkarak uzay-zaman dokusunu ve $E = \\gamma m_0 c^2$ bağıntısını kurdu.`,
      formulas: [
        { tex: '\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}, \\qquad \\Delta t = \\gamma \\Delta t_0, \\qquad L = \\frac{L_0}{\\gamma}', desc: 'Lorentz faktörü γ, zaman genişlemesi ve Lorentz-FitzGerald boy kısalması.' },
        { tex: '\\lambda_{\\text{gözlenen}} = \\lambda_0 \\sqrt{\\frac{1 - \\beta}{1 + \\beta}} \\quad (\\beta = v/c)', desc: 'Relativistik boyuna Doppler kayması.' }
      ],
      tasks: [
        { step: 'Uzay aracı hızını v = 0,866c yapın: Lorentz faktörünün tam γ = 2,00 olduğunu, araç boyunun yarıya indiğini (L = 0,5 L₀) ve araçtaki ışık saatinin Dünya saatine göre yarı hızda tik-tak yaptığını görün!', preset: { sub: '7_1', beta: 0.866 } },
        { step: 'Hızı v = 0,990c (γ = 7,09) değerine çıkararak aşırı boy kısalmasını ve relativistik Doppler maviye kaymasını gözlemleyin.', preset: { sub: '7_1', beta: 0.99 } }
      ]
    },
    mod7_2: {
      title: 'Kuantum Tünelleme (1B Zaman-Bağımlı Schrödinger Çözücü)',
      intuitive: `Klasik fizikte $5\\text{ eV}$ enerjili bir topu $8\\text{ eV}$ yüksekliğinde bir duvara atarsanız top %100 geri seker; duvarın arkasına geçmesi imkânsızdır. Ancak kuantum mekaniğinde elektron bir <b>dalga paketi ($\\psi(x,t)$)</b> olduğu için potansiyel duvarının içine girdiğinde aniden sıfırlanmaz; duvar içinde üstel olarak sönümlenir ($e^{-\\kappa x}$). Eğer duvar yeterince inceyse dalganın bir kısmı karşı tarafa sızar — buna <b>Kuantum Tünelleme</b> denir! Güneş'teki nükleer füzyon, Alfa bozunumu ve Taramalı Tünelleme Mikroskobu (STM) tamamen bu sayede çalışır.`,
      history: `<b>Friedrich Hund (1927)</b> moleküler izomerleşmede tünellemeyi fark etti; <b>George Gamow (1928)</b> çekirdekten Alfa bozunumunu kuantum tünellemeyle açıkladı; <b>Leo Esaki, Ivar Giaever ve Gerd Binnig / Heinrich Rohrer</b> tünelleme elektroniği ve STM ile Nobel Ödülü aldı.`,
      formulas: [
        { tex: 'i\\hbar \\frac{\\partial \\psi(x,t)}{\\partial t} = \\left(-\\frac{\\hbar^2}{2m}\\frac{\\partial^2}{\\partial x^2} + V(x)\\right)\\psi(x,t)', desc: 'Simülasyonun her karede sonlu-farklar (FDTD) yöntemiyle çözdüğü 1B Zaman-Bağımlı Schrödinger Denklemi.' },
        { tex: 'T \\approx e^{-2\\kappa a}, \\qquad \\kappa = \\frac{\\sqrt{2m(V_0 - E)}}{\\hbar}', desc: 'Potansiyel bariyerinden (V₀ > E, genişlik a) karşıya geçme (tünelleme) olasılığı T ve sönümlenme sabiti κ.' }
      ],
      tasks: [
        { step: 'Bariyer yüksekliğini V₀ = 1,25 × E (elektron enerjisinden yüksek!) ve genişliği ince tutarak "🌊 Dalga Paketini Ateşle" butonuna basın: dalganın bariyer içinden sızarak karşı tarafa tünellemesini (T > %15) izleyin!', preset: { sub: '7_2', V0: 1.25, width: 18, barrierType: 'single' } },
        { step: 'Bariyer tipini "Çift Rezonans Bariyeri (Fabry-Pérot Kuantum Kuyusu)" seçerek iki duvar arasında hapsolan rezonans dalgalarını gözlemleyin.', preset: { sub: '7_2', V0: 1.15, width: 14, barrierType: 'double' } }
      ]
    }
  };

  window.PhysData = {
    ELEMENTS,
    CATS,
    ORDER,
    CAP,
    L_OF,
    sup,
    calcNuclearProperties,
    SM_PARTICLES,
    HADRONS,
    PHOTO_METALS,
    SCIENCE_WIKI
  };
})();
