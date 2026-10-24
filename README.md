# affePhysics (affeLab: Physics) — Kapsamlı 3B Kuantum Atom ve Etkileşimli Fizik Laboratuvarı

**`affePhysics`**, `affeLab` (Kimya) platformunun kardeş projesi ve `scienceWiki` ekosisteminin fizik ayağı olarak geliştirilmiş; sıfır sunucu maliyetiyle (statik GitHub Pages üzerinde) çalışan, %100 Türkçe akademik terminolojiye sahip kapsamlı bir web fizik laboratuvarıdır.

---

## 🚀 Mimari Öne Çıkanlar

* **3B Kuantum Atom Preloader:** `#05070d` derin uzay siyahı üzerinde parlayan proton/nötron çekirdeği, eliptik Bohr yörüngeleri ve neon camgöbeği (`#00f2fe`) / elektrik moru (`#a855f7`) kuantum olasılık bulutu ($|\psi|^2$) katmanları.
* **Gerçek Matematiksel ve Fiziksel Çözücüler:**
  * **Kuantum Orbitalleri ($\psi_{nlm}$):** Asosiye Laguerre polinomları $R_{nl}(r)$ ve gerçek Küresel Harmonikler $Y_{lm}(\theta,\phi)$ ile 3B Monte Carlo olasılık bulutu, Canlı Cam (Ultra Glass) yüzeyler, $X/Y/Z$ kesit dilimleme ve Rabi dipol süperpozisyon salınımları.
  * **4. Dereceden Runge-Kutta (RK4):** Çift sarkaç, Kapitza ters sarkacı, 3-cisim kütleçekim problemi, Rutherford Coulomb saçılması ve Lorentz siklotron yörüngeleri için enerji kaymasını (drift) önleyen RK4 sayısal integrasyonu.
  * **1B Zaman-Bağımlı Schrödinger Çözücü (TDSE):** Staggered Leapfrog FDTD algoritmasıyla gerçek zamanlı Gauss elektron dalga paketi ve kuantum tünelleme ($T/R$) simülasyonu.
* **`scienceWiki` "Akademik Bilgi & Teori" Çekmecesi:** Her deney ve alt sekme için 4 sekmeli (**1. Sezgisel Mantık**, **2. Keşif Tarihi & Bilim İnsanı**, **3. KaTeX/LaTeX Matematiksel Motor**, **4. "Bunu Dene!" İnteraktif Deney Görevleri**) bilgi sistemi.

---

## 🧪 7 Ana Fizik Laboratuvar Modülü

1. **Modül 1 — Kuantum Atom, Nükleer Fizik ve Standart Model (Ana Ekran):**
   * `1.1` 3B Kuantum Atom ve Katman İnceleyici (118 Element, $1s \dots 5g$ orbitaller, 3 aşamalı derinlik zoom'u: Atom $10^{-10}\text{ m} \rightarrow$ Çekirdek $10^{-15}\text{ m} \rightarrow$ Kuark-Gluon $<10^{-15}\text{ m}$, Antimadde modu, Radyal dağılım grafiği ve Hund kutucukları)
   * `1.2` Tarihsel Atom Modelleri (Dalton, Thomson, Rutherford, Bohr, De Broglie, Schrödinger), Alfa/Foton Tabancası ve Canlı Cam Spektrometre (Lyman, Balmer, Paschen)
   * `1.3` Nükleer Fizik, Segrè Kararlılık Vadisi, Kütle Kusuru ($\Delta m c^2$) ve $^{235}\text{U}$ Zincirleme Fisyon Reaktörü
   * `1.4` Standart Model ve Hadron (Baryon $qqq$ / Mezon $q\bar{q}$) QCD Renk Yükü Sentezleyici
2. **Modül 2 — "Canlı Cam" Laboratuvarı:**
   * `2.1` Wilson Bulut Odası ($\alpha, \beta^\pm, \mu$ izleri ve Lorentz manyetik bükülmesi)
   * `2.2` J.J. Thomson Katot Işını Cam Tüpü (Crookes Tüpü, Wien hız seçici ve $e/m$ ölçümü)
   * `2.3` Einstein Fotoelektrik Etki Kuvars Cam Hücresi (5 metal, eşik frekansı, durdurma potansiyeli ve Planck eğimi)
   * `2.4` Millikan Yağ Damlası Mikroskop Vizörü ($F_e = F_g$ askı dengesi ve yük kuantizasyonu $q = n\cdot e$)
3. **Modül 3 — Klasik Mekanik, Dinamik ve Kaos Motoru:**
   * `3.1` Serbest Cisim Diyagramı (FBD) & Kinematik Kum Havuzu (Eğik düzlem, Atwood makarası, yaylı osilatör, eğik atış)
   * `3.2` Kaos Teorisi (Çift Sarkaç, Kapitza Ters Sarkacı, 3-Cisim Problemi, $\Delta\theta = 0.001^\circ$ Kelebek Etkisi ve 60 FPS Faz Uzayı)
4. **Modül 4 — Elektromanyetizma ve Maxwell Alan Laboratuvarı:**
   * `4.1` İnteraktif Elektrostatik/Manyetostatik Alan Kum Havuzu, Eşpotansiyel Isı Haritası ve Lorentz Parçacık Fırlatıcı
   * `4.2` Faraday Elektromanyetik İndüksiyonu ($\mathcal{E} = -N d\Phi_B/dt$) ve AC/DC Jeneratör
5. **Modül 5 — Geometrik & Fiziksel Optik Tezgahı:**
   * `5.1` Canlı Cam Mercekler, Fiber Optik (Tam İç Yansıma) ve Cauchy Dispersiyon Prizması ($n(\lambda) = A + B/\lambda^2$)
   * `5.2` Young Çift Yarık Deneyi, Tek Elektron Kuantum Girişimi ve Hangi-Yol Gözlemci Dalga Fonksiyonu Çökmesi
6. **Modül 6 — Termodinamik, İstatistiksel Fizik ve Akışkanlar Mekaniği:**
   * `6.1` Maxwell-Boltzmann İdeal Gaz Odası, Piston ve Maxwell'in Cini (Entropi Kapısı)
   * `6.2` Bernoulli Akışkanlar Tüneli (Venturi Borusu Manometreleri ve NACA Uçak Kanadı Kaldırma Kuvveti)
7. **Modül 7 — Özel Görelilik ve Kuantum Dalga Mekaniği:**
   * `7.1` Einstein Özel Görelilik Çift Gözlemci Laboratuvarı (Foton Işık Saati, Zaman Genişlemesi, Boy Kısalması ve Doppler Kayması)
   * `7.2` Kuantum Tünelleme (1B Zaman-Bağımlı Schrödinger Çözücü — TDSE)
