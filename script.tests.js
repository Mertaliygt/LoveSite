/* script.tests.js - Gelişmiş quiz motoru (10 soru, zor seviye) */
(() => {
  "use strict";

  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

  // Küçük yardımcılar
  const shuffle = (arr) => arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);

  // ——— ZOR TEST (10 soru) ———
  // Puanlama: 0–4 arası ağırlıklar; toplam maksimum 40.
  const TEST_CATALOG = [
       

    {
      id: "iliski-zor-1",
      name: "İlişki Dinamikleri — Zor Seviye",
      desc: "Çatışma yönetimi, duygu düzenleme, bilişsel çarpıtmalar ve uzlaşma kapasitesi için derinlik testi.",
      questions: [
        {
          q: "Kavga sırasında partnerin duygularını yanlış okuduğunu fark ettiğinde ilk refleksin nedir?",
          options: [
            "Kendi yorumumu savunur, karşı argüman üretirim.",
            "Durup tekrar sorar, onay/çürütme isterim.",
            "Konuyu kapatıp uzaklaşırım.",
            "Duyguyu doğru anlamak için örnek/hafifletici açıklama isterim."
          ],
          // doğruya yakın: açık doğrulama/yeniden çerçeveleme (3–4), kaçınma/savunma düşük (0–1)
          scores: [1, 3, 0, 4]
        },
        {
          q: "Aşırı genelleme ('Sen hep…', 'Ben asla…') yaptığını fark ettiğinde nasıl düzeltirsin?",
          options: [
            "Somut olaya indirger, kanıt sorar/sağlarım.",
            "Tonu düşürürüm ama genellemeyi sürdürürüm.",
            "Vazgeçer, konuyu değiştiririm.",
            "Genellemeyi bırakır, birlikte test edilebilir hipotez kurarım."
          ],
          scores: [3, 1, 0, 4]
        },
        {
          q: "Sınır koyman gerektiğinde kullandığın ifade tarzı hangisine en yakın?",
          options: [
            "“Beni böyle kabul etmek zorundasın.”",
            "“Şu durumda şunu yapmayacağım; ihtiyacım bu.”",
            "“Sen yüzünden mecburum.”",
            "“Şu davranış olduğunda şunları hissediyorum ve şu sınırı koyuyorum.”"
          ],
          scores: [0, 3, 1, 4]
        },
        {
          q: "Yüksek stresliyken tartışmayı sürdüreceksen hangi stratejiyi uygularsın?",
          options: [
            "Sürdürürüm; duygular geçicidir.",
            "5–15 dk mola, sonra net çerçeveyle dönme.",
            "Ertesi güne bırakırım (konu belirsiz kalır).",
            "Temel ihtiyaçları (uyku/açlık) kontrol edip kısa oturum planlarım."
          ],
          scores: [1, 4, 0, 3]
        },
        {
          q: "Haksız olduğun anlaşıldığında onarım (repair attempt) nasıl yaparsın?",
          options: [
            "“Tamam özür dilerim” deyip geçerim.",
            "Somut etkileri kabul eder, telafi adımı öneririm.",
            "Savunmaya geçer, karşı hataları sayarım.",
            "Duyguyu adlandırır, sorumluluk alır, birlikte çözüm planı yaparım."
          ],
          scores: [1, 4, 0, 3]
        },
        {
          q: "Partnerinin değersiz hissettiğini sezdiğinde ilk yapacağın nedir?",
          options: [
            "Niyet savunması: “Öyle demek istemedim.”",
            "Deneyimi yansıtırım: “Böyle hissettiğini duyuyorum…”",
            "Konuyu bilgiye çeviririm: “Gerçeğe bakalım.”",
            "Duygu + ihtiyaç + eylem: “Böyle hissettiğinde neye ihtiyacın var?”"
          ],
          scores: [1, 3, 0, 4]
        },
        {
          q: "‘Zihin okuma’ yaptığını fark ettiğinde (o böyle düşünüyor sanmak) hangi adımı atarsın?",
          options: [
            "Varsayımı test ederim: açıkça sorarım.",
            "Kendi içimde tartar, paylaşmam.",
            "Geçmiş örneklerle doğrularım.",
            "Varsayımı askıya alır, duygu/istek seviyesine inerim."
          ],
          scores: [4, 1, 0, 3]
        },
        {
          q: "Uzlaşma ararken BATNA (en iyi alternatif) farkındalığın nasıl işliyor?",
          options: [
            "Sonuç odaklıyım; ilişki dinamiğini ikinci plana atarım.",
            "Kendi BATNA’mı bilirim; karşı tarafınkini merak ederim.",
            "BATNA düşünmem; anlık çözüme bakarım.",
            "İki tarafın BATNA’sını açık ederek kazan-kazan alanı kurarım."
          ],
          scores: [1, 3, 0, 4]
        },
        {
          q: "Tartışma ‘konu kayması’ yaşadığında ne yaparsın?",
          options: [
            "Yeni konuya geçerim; akışa bırakırım.",
            "Toparlayıp özgün soruna döner, yan başlıkları park ederim.",
            "Kaymayı kullanır, karşı hataları gündeme getiririm.",
            "Hedef tanımlar, kronoloji kurar, tek soruya odaklarım."
          ],
          scores: [0, 4, 1, 3]
        },
        {
          q: "İlişkide tekrarlayan bir problemi döngü olarak modellemek gerekse ilk adımın?",
          options: [
            "Suçlu/mağdur rolleri atarım.",
            "Tetikleyici—yorum—duygu—tepki—sonuç zinciri kurarım.",
            "Sadece davranışa odaklanırım.",
            "Duygu düzenleme tekniklerini (nefes, erteleme) zincire entegre ederim."
          ],
          scores: [0, 4, 1, 3]
        }
      ],
      rubric(score, max){
        const pct = Math.round((score / max) * 100); // max = 40
        if (pct >= 80) return { title: "Uzmanlaşmaya Yakın", msg: "Onarım, sınır ve uzlaşma becerilerin güçlü; karmaşık çatışmaları yönetebiliyorsun." };
        if (pct >= 60) return { title: "Sağlam Temeller", msg: "Çoğu durumda etkili ilerliyorsun; odaklanacağın birkaç mikro beceri büyük sıçrama getirir." };
        return { title: "Gelişime Açık", msg: "Bilişsel çarpıtmaları yakalama, onarım dili ve molalı tartışma pratikleri ile hızla ilerleyebilirsin." };
      }
    },
    // === EK TEST 1: Ne Kadar Toksiksin? — Zor ===
// Not: Yüksek puan = sağlıklı/toksik olmayan davranış; düşük puan = toksiklik riski
{
  id: "toksik-zor-1",
  name: "Ne Kadar Toksiksin? — Zor",
  desc: "Sınır ihlali, manipülatif kalıplar, sorumluluk alma ve onarım becerilerini ölçer.",
  questions: [
    {
      q: "Hatanı fark ettiğinde tipik yaklaşımın hangisine en yakın?",
      options: [
        "Bahane üretirim; niyetimi vurgularım.",
        "Sorumluluğu kısmen alır, karşı tarafı da işaret ederim.",
        "Somut etkiyi kabul eder, net özür ve telafi planı sunarım.",
        "Konuyu değiştirir, gülüp geçerim."
      ],
      scores: [1, 2, 4, 0]
    },
    {
      q: "Partnerinin hislerini küçümseyici mizah (gaslighting’e yakın) kullandığını fark ettiğinde…",
      options: [
        "“Abartma ya” gibi cümlelerle hafife alırım.",
        "Öyle demek istemediğimi söyler, hızla kapatırım.",
        "Duyguyu tanırım, etkisini sorar, gerekirse düzeltirim.",
        "Savunur, örneklerle haklı çıkarırım."
      ],
      scores: [0, 1, 4, 1]
    },
    {
      q: "İletişimde güç kullanımı (sessizlik, cezalandırıcı geri çekilme) alışkanlığın?",
      options: [
        "Sık kullanırım; karşı taraf anlasın diye susarım.",
        "Nadiren başvururum; gerilim yüksekse olur.",
        "Bilerek kullanmam; mola verir, çerçeveyle geri dönerim.",
        "Kullanmam; anında çözmeye zorlarım."
      ],
      scores: [0, 2, 4, 1]
    },
    {
      q: "Sınır ihlali uyarısı aldığında tepkin?",
      options: [
        "“Kusura bakma” deyip rutine devam ederim.",
        "Ne demek istediğini sorar ama değişmem.",
        "Somut davranışı değiştirir, takip için sözleşirim.",
        "Savunmaya geçer, karşı sınır ihlallerini sıralarım."
      ],
      scores: [1, 2, 4, 0]
    },
    {
      q: "Kıskançlık esnasında telefon/şifre talebi gibi kontrolcü eğilimler?",
      options: [
        "Güven için şart; isterim.",
        "Duruma göre talep ederim.",
        "Talep etmem; duygu ve ihtiyaç konuşurum.",
        "Dolaylı kontrol (takip, sorgu) uygularım."
      ],
      scores: [0, 1, 4, 0]
    },
    {
      q: "Çifte standart (ben yapınca olur, o yapınca olmaz) eğilimin?",
      options: [
        "Bazen olur; kabul ederim.",
        "Olmaz; tutarlılık ararım.",
        "Sık olur; ilişkide normaldir.",
        "Fark edince düzeltir, özür ve plan yaparım."
      ],
      scores: [2, 4, 0, 4]
    },
    {
      q: "Tartışmada ‘kazanmaya’ odaklanma seviyen?",
      options: [
        "Yüksek; haklılığım önemli.",
        "Orta; bazen tutulurum.",
        "Düşük; çözüm/onarım öncelik.",
        "Duruma göre değişir, ama ilişki hedefi ağır basar."
      ],
      scores: [0, 2, 4, 3]
    },
    {
      q: "Sessiz anlaşmalar/kurallar (metasözleşme) ihlâl edildiğinde…",
      options: [
        "Karşı hata sayarım; puan tutarım.",
        "Konuyu açar ama net aksiyon alamam.",
        "Netleştirir, birlikte revize eder, yazılı takvimleriz.",
        "Görmezden gelirim; birikir."
      ],
      scores: [0, 2, 4, 1]
    },
    {
      q: "Partnerin zayıf noktasını tartışmada koz olarak kullanma eğilimin?",
      options: [
        "Olur; etkili bir yöntemdir.",
        "Nadiren, çok sinirliysem.",
        "Asla; güveni zedeler.",
        "Olursa da hemen onarım yaparım."
      ],
      scores: [0, 1, 4, 3]
    },
    {
      q: "Uzatılmış krizlerde ‘onarım girişimi’ (repair attempt) başlatma sıklığın?",
      options: [
        "Nadiren; zaman çözer.",
        "Bazen; karşı taraftan beklerim.",
        "Sık; ben başlatırım ve plan yaparım.",
        "Duruma göre; ama ertelemem."
      ],
      scores: [0, 2, 4, 3]
    }
  ],
  rubric(score, max){
    const pct = Math.round((score / max) * 100); // max ~ 40
    if (pct >= 80) return { title: "Düşük Toksisite", msg: "Sorumluluk alma, onarım ve sınır saygısı güçlü. Sağlıklı iletişim kalıpları baskın." };
    if (pct >= 60) return { title: "Orta Risk", msg: "Yer yer savunma/kaçınma görülüyor. Onarım ve sınır netliği pratikleriyle daha da sağlıklı bir çizgiye gelebilirsin." };
    return { title: "Yüksek Risk", msg: "Kontrol/cezalandırma, çifte standart ve küçümseme kalıplarını azalt. Küçük, net davranış değişimleri büyük fark yaratır." };
  }
},

// === EK TEST 2: Ne Kadar Kıskançsın? — Zor ===
// Not: Yüksek puan = sağlıklı kıskançlık yönetimi; düşük puan = problemli/yoğun kıskançlık
{
  id: "kiskanclik-zor-1",
  name: "Ne Kadar Kıskançsın? — Zor",
  desc: "Güven, özdeğer, kontrol dürtüsü ve kayıp korkusunu yönetme becerilerini ölçer.",
  questions: [
    {
      q: "Partnerinin sosyal ortamda ilgi görmesini nasıl çerçevelersin?",
      options: [
        "Tehdit; mesafe koymasını isterim.",
        "Rahatsız olurum ama dile getirmem.",
        "Duygumu söyler, güven/özdeğer diyalogu kurarım.",
        "Normal; sınırlar netse sorun görmem."
      ],
      scores: [0, 1, 3, 4]
    },
    {
      q: "Kıskançlık geldiğinde ilk düzenleme adımın?",
      options: [
        "Kanıt ararım (mesaj, konum, kanıt).",
        "Duyguyu bastırırım.",
        "Duyguyu adlandırır, bedenimi regüle eder, sonra konuşurum.",
        "Karşılaştırma yapar, geçmiş örnekleri masaya koyarım."
      ],
      scores: [0, 1, 4, 1]
    },
    {
      q: "Sosyal medya etkileşimleri (beğeni/yorum) konusu açıldığında…",
      options: [
        "Kurallar koyarım; ihlâlde yaptırım uygularım.",
        "Sınır isterim ama müzakereye açığım.",
        "Değerler ve şeffaflık ilkeleri tanımlarız.",
        "Karışmam; tamamen serbest olmalı."
      ],
      scores: [0, 2, 4, 1]
    },
    {
      q: "Kayıp korkusu (terk edilme) tetiklendiğinde düşünce akışın?",
      options: [
        "Felaket senaryoları kurarım.",
        "Kendimi değersiz hissettiğimi fark ederim.",
        "Düşünceyi yakalar, kanıt/karşı kanıt tartarım.",
        "Hemen partneri baskılarım."
      ],
      scores: [0, 2, 4, 0]
    },
    {
      q: "Şeffaflık-talep dengesinde ideal yaklaşımın?",
      options: [
        "Sınırsız şeffaflık talep ederim.",
        "Duruma göre şeffaflık isterim.",
        "İhtiyaç temelli, rızalı ve çift yönlü şeffaflık.",
        "Şeffaflık gereksiz; kıskançlık normaldir."
      ],
      scores: [0, 2, 4, 0]
    },
    {
      q: "Kıskançlık tetikleyicini partnerinle konuşma biçimin?",
      options: [
        "Suçlayıcı dil kullanırım.",
        "Nedenleri anlatır, çözüm beklerim.",
        "Ben dili + ihtiyaç + somut istekle konuşurum.",
        "Konuşmam; mesafe koyarım."
      ],
      scores: [0, 2, 4, 1]
    },
    {
      q: "Özdeğerin kıskançlıkla ilişkisinde hangi cümle sana yakın?",
      options: [
        "Onun ilgisi azalırsa ben değerimi kaybederim.",
        "Bazen kendimi yetersiz hissederim.",
        "Değerimi partnerimden bağımsız kurarım.",
        "Değerimi kanıtlamak için kontrol etmeliyim."
      ],
      scores: [0, 2, 4, 0]
    },
    {
      q: "‘Gri alanlar’ (eski arkadaş, iş ilişkisi) için protokoller…",
      options: [
        "Sert yasaklar koyarım.",
        "Duruma göre hoş görürüm.",
        "Karşılıklı şeffaflık + sınır + check-in planı yaparız.",
        "Kendi kurallarım esner; partneriminki esnemez."
      ],
      scores: [0, 2, 4, 0]
    },
    {
      q: "Kıskançlığın davranışa dönüştüğü anlarda en sorunlu kalıbın hangisi?",
      options: [
        "Takip/denetleme/hesap sorma.",
        "Alay/küçümseme.",
        "İçime atıp cezalandırıcı mesafe.",
        "Yetişkin dilinde ihtiyaç konuşması."
      ],
      scores: [0, 1, 1, 4]
    },
    {
      q: "Kıskançlık sonrası ‘onarım’ yapma biçimin?",
      options: [
        "Görmezden gelirim; geçer.",
        "Özür dilerim ama değişmem.",
        "Etkisini kabul eder, sınır/alışkanlık revizesi yaparım.",
        "Onarım + takip randevusu (check-in) planlarım."
      ],
      scores: [0, 1, 4, 4]
    }
  ],
  rubric(score, max){
    const pct = Math.round((score / max) * 100);
    if (pct >= 80) return { title: "Sağlıklı Denge", msg: "Şeffaflık, özdeğer ve sınır yönetimi güçlü. Kıskançlığı ilişkiyi besleyen bilgiye çeviriyorsun." };
    if (pct >= 60) return { title: "Yönetilebilir Düzey", msg: "Bazen kontrol/kaçınma kaymaları var. Ben dili ve regülasyon pratikleriyle daha da güçlenirsin." };
    return { title: "Yüksek Kıskançlık Riski", msg: "Kontrol dürtüsü ve kayıp korkusu üzerine çalış. Şeffaflık ve sınır protokollerini rızayla kurmak kritik." };
  }
},{
  id: "drama-komik-1",
  name: "Ne Kadar Drama Queensin?",
  desc: "Her şeyi abartıyor musun yoksa tam bir zen ustası mısın?",
  questions: [
    {
      q: "Telefonuna 2 dk cevap verilmedi, ilk tepkin?",
      options: [
        "‘Herhalde duşta’ deyip geçerim.",
        "Arka arkaya 7 kere ararım.",
        "Instagram’da son paylaşılan story’ye bakarım.",
        "Drama! Tweet atarım: ‘Kimse beni sevmiyor…’"
      ],
      scores: [4, 1, 2, 0]
    },
    {
      q: "Partnerin ‘iyiyim’ dedi. Senin beyninde?",
      options: [
        "İyidir işte.",
        "Kesin benden soğudu.",
        "İyiyim = ölüyorum.",
        "Psikolojik analiz raporu çıkarırım."
      ],
      scores: [4, 1, 2, 0]
    },
    {
      q: "Dizide karakter ayrıldı. Senin tepkilerin?",
      options: [
        "Aa üzüldüm biraz.",
        "Sosyal medyada hashtag açarım.",
        "3 gün yas tutarım.",
        "Yönetmene mail atarım: ‘Bunu yapmaya hakkınız yok!’"
      ],
      scores: [4, 2, 1, 0]
    }
  ],
  rubric(score, max){
    const pct = Math.round((score / max) * 100);
    if(pct >= 70) return { title:"Zen Bahçesi", msg:"Dramadan uzak, çayını yudumlarken sakin bir hayat sürüyorsun." };
    if(pct >= 40) return { title:"Mini Drama", msg:"Arada bir sahneye çıkıyorsun ama tadında." };
    return { title:"Full Drama Queen", msg:"Hollywood’da rol kapabilirsin. Evin mutfak değil sahne!" };
  }
},
{
  id: "caykahve-komik-1",
  name: "Çay mı Kahve mi İnsansın?",
  desc: "Sıcak içecek tercihin karakterini ele veriyor mu?",
  questions: [
    {
      q: "Sabah alarm çaldı. İlk iş?",
      options: [
        "Gözümü açmadan kahve makinesine koşarım.",
        "Çayı demlemeden ben ben değilim.",
        "Enerji içeceği açarım.",
        "Alarmla kavga ederim."
      ],
      scores: [2, 2, 0, 1]
    },
    {
      q: "Dışarıda otururken içecek menüsüne bakışın?",
      options: [
        "Sade Türk kahvesi, netim.",
        "Açık çay, bardak büyük olsun.",
        "Latte, karamelli, ekstra köpük…",
        "Menüyü kapatır: ‘Abi soda getir’ derim."
      ],
      scores: [2, 2, 1, 0]
    },
    {
      q: "Buluşmaya 30 dk geç kalındı. Sen?",
      options: [
        "Bir çay daha söylerim.",
        "Kahvesiz beklemem, sinir basar.",
        "Story atarım: ‘Beklemek hayatın özeti…’",
        "Uykum geldi, kalktım."
      ],
      scores: [2, 1, 0, 0]
    }
  ],
  rubric(score, max){
    const pct = Math.round((score / max) * 100);
    if(pct >= 60) return { title:"Çay–Kahve Dengesi", msg:"Sen içeceğini bahaneyle değil keyifle içiyorsun. Tam dengelisin." };
    if(pct >= 30) return { title:"Tek Yönlü", msg:"Ya kahve ya çay… Belli ki kalbin tek taraflı atıyor." };
    return { title:"Sıvı Karmaşası", msg:"Su içmeyi dene belki daha huzurlu olursun 😅" };
  }
},
{
  id: "usengec-komik-2",
  name: "Ne Kadar Üşengeçsin?",
  desc: "Yatağından kalkmaya üşenenlerin testi (6 soru).",
  questions: [
    {
      q: "TV kumandası diğer odada. Ne yaparsın?",
      options: ["Kalkar alırım.","Bağırırım: ‘Biri getirsin!’","Telefonla arkadaşımı ararım.","Kalkmam, kaderime razı olurum."],
      scores: [3,2,1,0]
    },
    {
      q: "Yemek siparişi geldi. Aşağıdan senin alman lazım. Tepkin?",
      options: ["Hemen inerim.","5 dk kapıda bekletirim.","‘Komşu alsa nolur’ diye düşünürüm.","Teslim alınmazsa zaten geri götürür."],
      scores: [3,2,1,0]
    },
    {
      q: "Çorap giymek bile zor geliyorsa…",
      options: ["Asla olmaz.","Bazen kışın.","Sık sık, terlikle çıkarım.","Yataktan kalkmak bile başarı."],
      scores: [3,2,1,0]
    },
    {
      q: "Kettle’a su koymak yerine?",
      options: ["Her seferinde doldururum.","Biri doldursun diye beklerim.","Su yoksa kahve iptal.","Çayı bardakta demlemeye çalışırım."],
      scores: [3,2,1,0]
    },
    {
      q: "Telefon şarjı odada kaldı. Sen?",
      options: ["Hemen alırım.","Yarım saat beklerim.","%1 olana kadar bakmam.","Başkasının şarj aletine çökerim."],
      scores: [3,2,1,0]
    },
    {
      q: "Üşengeçlik rekorun?",
      options: ["Olmaz, hep hareketliyim.","1–2 kere.","Sayısız kez.","Yemek sipariş edip kapıyı açmadım."],
      scores: [3,2,1,0]
    }
  ],
  rubric(score,max){
    const pct=Math.round((score/max)*100);
    if(pct>=70) return {title:"Enerjik Panda",msg:"Üşengeçlikle işin yok, maşallah turbo moddasın 🚀"};
    if(pct>=40) return {title:"Orta Halli Üşengeç",msg:"Kalkıyorsun ama söylene söylene… klasik Türk modu."};
    return {title:"Üşengeçliğin Simgesi",msg:"Dünya yansa, sen ‘wifi çekiyor mu?’ diye sorarsın 😅"};
  }
},{
  id: "arkadas-komik-2",
  name: "Arkadaş Grubunda Hangi Tipsin?",
  desc: "Grubun maskotu musun, yoksa stratejisti mi? (7 soru).",
  questions: [
    {
      q: "Grup buluşmasına hep…",
      options:["İlk ben giderim.","Son ben giderim.","Hiç gitmem.","Yolda kaybolurum."],
      scores:[3,2,1,0]
    },
    {
      q: "Ortak hesap ödenecek. Sen?",
      options:["Hesap makinesiyle adil dağıtırım.","‘Ben çay içmedim’ derim.","Kaçarım tuvalete.","Hesabı ben öderim."],
      scores:[3,2,1,0]
    },
    {
      q: "Tatilde görev dağılımında?",
      options:["Organizatörüm.","Yancıyım.","Planı bozarım.","Moral bozarım."],
      scores:[3,2,1,0]
    },
    {
      q: "Grup WhatsApp’tan 200 mesaj attı. Sen?",
      options:["Hepsini okurum.","Özet isterim.","Hiç bakmam.","Sticker atarım."],
      scores:[3,2,1,0]
    },
    {
      q: "Biri doğum günü kutlamadı. Sen?",
      options:["Küserim.","Hatırlatırım.","Umursamam.","Instagram’da laf sokarım."],
      scores:[2,3,3,0]
    },
    {
      q: "Grup film seçiyor. Tepkin?",
      options:["Ben seçerim.","Oylama isterim.","Ne denk gelirse.","Benim istediğim olmazsa gelmem."],
      scores:[3,2,1,0]
    },
    {
      q: "Grup esprisi unutuldu. Sen?",
      options:["Hatırlatırım.","Yenisini üretirim.","Bilmiyormuş gibi yaparım.","Aşırı dramatize ederim."],
      scores:[3,3,2,1]
    }
  ],
  rubric(score,max){
    const pct=Math.round((score/max)*100);
    if(pct>=70) return {title:"Lider Karakter",msg:"Grubun direği sensin, senden izinsiz yaprak kıpırdamaz."};
    if(pct>=40) return {title:"Tatlı Yancı",msg:"Sen grubun rengi, drama yok huzur var."};
    return {title:"Kaos Makinesi",msg:"Arkadaşlar tatil planlarken sen WiFi şifresini soruyorsun 😂"};
  }
},
{
  id: "bakkal-komik-2",
  name: "Bakkala Gidince Ne Tip İnsansın?",
  desc: "Ekmeğe gidip cipsle dönenler için (6 soru).",
  questions: [
    {
      q:"Ekmek almaya çıktın. Sonuç?",
      options:["Sadece ekmek.","Ekmek + çikolata.","Cips, kola, çekirdek…","Ekmek hariç her şey!"],
      scores:[3,2,1,0]
    },
    {
      q:"Bakkala selam vermeyi unuttun. Sen?",
      options:["Sonraki gün 2 kat selam.","Bir daha girmem.","Takmam.","Story atarım: ‘Bakkalla küstük’."],
      scores:[3,2,1,0]
    },
    {
      q:"Bozuk para üstü eksik geldi. Sen?",
      options:["Nazikçe söylerim.","Umursamam.","Eve gidince hesap yaparım.","Twitter’a yazarım."],
      scores:[3,2,1,0]
    },
    {
      q:"Bakkal veresiye defterine yazdı. Sen?",
      options:["Zamanında öderim.","Unuturum.","Aylarca kaçınırım.","Defteri yakarım 😅"],
      scores:[3,2,1,0]
    },
    {
      q:"Kredi kartı geçmedi. Tepkin?",
      options:["Nakit veririm.","Başka kart denemem.","‘Sonra getiririm’ derim.","Utanıp taşınırım."],
      scores:[3,2,1,0]
    },
    {
      q:"Bakkal poşet vermedi. Sen?",
      options:["Sorun yok.","‘Poşetsiz olur mu ya’ derim.","Ürünleri montun cebine tıkarım.","Eşyaları tek tek taşırım."],
      scores:[3,2,1,0]
    }
  ],
  rubric(score,max){
    const pct=Math.round((score/max)*100);
    if(pct>=70) return {title:"Disiplinli Alışverişçi",msg:"Listeye sadıksın, cebini de koruyorsun."};
    if(pct>=40) return {title:"Orta Derece Sapmacı",msg:"Liste var ama Nutella göz kırpınca kayıyorsun."};
    return {title:"Ekmek Hariç Her Şey",msg:"Bakkal seni görünce ‘bugün satış patlayacak’ diyor 😂"};
  }
},{
  id: "ruh-esi-komik-1",
  name: "Ruh Eşin Ne?",
  desc: "İnsan değil, yiyecek mi, hayvan mı yoksa eşya mı? 🤔",
  questions: [
    {
      q: "Bir gününü en çok hangisi özetler?",
      options: ["Kahve kokusu","Kedi miyavı","Telefon titreşimi","Fast food kokusu"],
      scores: [2,3,1,0]
    },
    {
      q: "Moralin bozulunca ilk yaptığın şey?",
      options: ["Yemek sipariş ederim.","Kedilere sarılırım.","Arkadaşımı ararım.","Uyurum."],
      scores: [0,3,2,1]
    },
    {
      q: "Aşkı hangi nesne ile tarif edersin?",
      options: ["Çikolata","Battaniye","WiFi","PlayStation"],
      scores: [2,3,1,0]
    },
    {
      q: "Biri seni aramadığında tepkin?",
      options: ["‘Unuttu galiba’ derim.","Drama yaparım.","‘Ben de aramıyım’ derim.","Story atarım."],
      scores: [3,0,2,1]
    },
    {
      q: "Tatilde en sevdiğin aktivite?",
      options: ["Yemek yemek","Deniz kenarı uyumak","Fotoğraf çekmek","Gece eğlencesi"],
      scores: [2,3,1,0]
    },
    {
      q: "Sabah kalktığında ilk düşündüğün şey?",
      options: ["Kahve!","Uykuya devam.","Bugün kimle buluşsam?","Telefonum nerede?"],
      scores: [2,3,1,0]
    },
    {
      q: "Hayalindeki ruh eşi sana…",
      options: ["Sıcacık tost yapar.","Sürekli kucak verir.","Mesajlara anında döner.","Senle oyun oynar."],
      scores: [2,3,1,0]
    }
  ],
  rubric(score, max){
    const pct=Math.round((score/max)*100);
    if(pct>=70) return { title:"Senin Ruh Eşin: Yumuşacık Battaniye 🛌", msg:"Her şeyi sarıp sarmalayan, huzur veren biri arıyorsun." };
    if(pct>=40) return { title:"Senin Ruh Eşin: Çikolata 🍫", msg:"Hayatın tatlı tarafını seviyorsun, ruh eşin sana enerji verecek." };
    return { title:"Senin Ruh Eşin: WiFi 📶", msg:"Bağlantı kesilince hayat duruyor. Ruh eşin: hızlı internet 😂" };
  }
},{
  id: "ulke-komik-1",
  name: "Hangi Ülkenin İnsanısın?",
  desc: "Alışkanlıkların seni hangi ülkeye benzetiyor? 🌍",
  questions: [
    {
      q: "Sabah kahvaltında olmazsa olmaz?",
      options: ["Zeytin-peynir","Kruvasan","Sosisli-sucuklu","Pirinç lapası"],
      scores: [3,2,1,0]
    },
    {
      q: "Trafikte sıkışınca ne yaparsın?",
      options: ["Korna çalarım.","Sessizce beklerim.","Şarkı açarım.","Küfrederim."],
      scores: [3,2,1,0]
    },
    {
      q: "Yemek sipariş ederken tercihin?",
      options: ["Kebap","Pizza","Burger","Sushi"],
      scores: [3,2,1,0]
    },
    {
      q: "Tatilde nereye gitmek istersin?",
      options: ["Ege sahilleri","Paris","New York","Tokyo"],
      scores: [3,2,1,0]
    },
    {
      q: "Maç izlerken tepkilerin?",
      options: ["Bağırırım, söylenirim.","Sakin sakin izlerim.","Sadece reklamlara bakarım.","Uyurum."],
      scores: [3,2,1,0]
    },
    {
      q: "Mutfaktaki favori içeceğin?",
      options: ["Çay","Şarap","Kola","Yeşil çay"],
      scores: [3,2,1,0]
    },
    {
      q: "Komşu ile ilişki?",
      options: ["Kapıya tabak bırakırım.","Selamlaşırım.","Tanımam.","Yok sayarım."],
      scores: [3,2,1,0]
    },
    {
      q: "Çalışma tarzın?",
      options: ["Gece gündüz çalışırım.","Programlı düzenli.","Daha çok lafta çalışırım.","Sessizlik + minimalizm."],
      scores: [3,2,1,0]
    }
  ],
  rubric(score, max){
    const pct=Math.round((score/max)*100);
    if(pct>=70) return { title:"Sen Tam Bir Türk 🇹🇷", msg:"Çay, kebap, komşuluk… DNA kodların Türk kahvaltısı kokuyor." };
    if(pct>=40) return { title:"Senin Ruhun Avrupalı 🇫🇷", msg:"Düzen, kruvasan, şarap… İçindeki Parisli ortaya çıkıyor." };
    return { title:"Senin İçinde Asyalı Var 🇯🇵", msg:"Minimalizm, sushi, yeşil çay… İçinden bir Japon çıktı 😂" };
  }
},








  ];

  // —— State ——
  let current = null, step = 0, choice = null, answers = [];
  const SCORE_KEY = "quiz_scores_v1";

  // —— Helpers ——
  const saveScore = (testId, score, max) => {
    try{
      const all = JSON.parse(localStorage.getItem(SCORE_KEY) || "{}");
      all[testId] = { score, max, at: Date.now() };
      localStorage.setItem(SCORE_KEY, JSON.stringify(all));
    }catch{}
  };
  const loadScores = () => { try{ return JSON.parse(localStorage.getItem(SCORE_KEY) || "{}"); }catch{ return {}; } };

  // —— List view ——
  function renderTestList(){
    const box = $("#testList");
    const host = $("#quizHost");
    if(!box || !host) return;
    host.style.display = "none";
    box.innerHTML = "";

    const scores = loadScores();

    TEST_CATALOG.forEach(t => {
      const item = document.createElement("div");
      item.className = "test-item";
      item.innerHTML = `
        <div class="meta">
          <div class="name">${t.name}</div>
          <div class="desc">${t.desc}</div>
          ${scores[t.id] ? `<div class="desc">Son skorun: ${scores[t.id].score}/${scores[t.id].max}</div>` : ""}
        </div>
        <div class="actions">
          <button class="btn sm btn-ghost" data-id="${t.id}" data-act="details">Detay</button>
          <button class="btn sm" data-id="${t.id}" data-act="start">Başla</button>
        </div>
      `;
      box.appendChild(item);
    });

    box.addEventListener("click", (e)=>{
      const btn = e.target.closest("button[data-act]");
      if(!btn) return;
      const id = btn.getAttribute("data-id");
      const act = btn.getAttribute("data-act");
      if (act === "start") {
        location.hash = `quiz/${id}`;
      } else {
        alert("Zor seviye: Onarım, sınır koyma, bilişsel çarpıtmalar, uzlaşma ve süreç yönetimi odaklıdır.");
      }
    });
  }

  // —— Quiz view ——
  function startQuizById(id){
    const test = TEST_CATALOG.find(t => t.id === id);
    if(!test){ alert("Test bulunamadı."); location.hash = "#tests"; return; }
    current = { ...test, questions: shuffle(test.questions) }; // soruları karıştır
    step = 0; answers = []; choice = null;
    renderQuiz();
  }

  function renderQuiz(){
    const box = $("#testList");
    const host = $("#quizHost");
    if(!host || !box) return;

    box.innerHTML = "";
    host.style.display = "flex";
    host.innerHTML = "";

    const q = current.questions[step];

    const header = document.createElement("div");
    header.className = "quiz-header";
    header.innerHTML = `
      <div class="quiz-title">${current.name}</div>
      <div class="quiz-progress">${step+1} / ${current.questions.length}</div>
    `;

    const card = document.createElement("div");
    card.className = "quiz-card";
    card.innerHTML = `<div class="quiz-q">${q.q}</div>`;

    const opts = document.createElement("div");
    opts.className = "quiz-options";
    const shuffled = q.options.map((opt, i) => ({opt, i})); // görünüm için karıştırmadan bırakıyoruz; istersen burada da shuffle yapabilirsin
    shuffled.forEach(({opt, i}) => {
      const row = document.createElement("label");
      row.className = "quiz-option";
      row.innerHTML = `
        <input type="radio" name="qopt" value="${i}" ${choice===i?"checked":""}/>
        <div>${opt}</div>
      `;
      row.addEventListener("click", () => { choice = i; });
      opts.appendChild(row);
    });
    card.appendChild(opts);

    const actions = document.createElement("div");
    actions.className = "quiz-actions";

    const back = document.createElement("button");
    back.className = "btn btn-ghost";
    back.textContent = step === 0 ? "Vazgeç" : "Geri";
    back.addEventListener("click", () => {
      if(step === 0){ location.hash = "#tests"; }
      else { step--; choice = answers[step] ?? null; renderQuiz(); }
    });

    const next = document.createElement("button");
    next.className = "btn";
    next.textContent = step === current.questions.length - 1 ? "Bitir" : "İleri";
    next.addEventListener("click", () => {
      if(choice == null){ alert("Lütfen bir seçenek seç."); return; }
      answers[step] = choice;
      if(step < current.questions.length - 1){
        step++; choice = answers[step] ?? null; renderQuiz();
      } else {
        const total = current.questions.reduce((acc, q, i)=> acc + (q.scores[answers[i]] ?? 0), 0);
        const max = current.questions.reduce((acc, q)=> acc + Math.max(...q.scores), 0); // 10 soru x 4 = 40
        saveScore(current.id, total, max);
        renderResults(total, max);
      }
    });

    actions.append(back, next);
    host.append(header, card, actions);
  }

  function renderResults(score, max){
    const host = $("#quizHost");
    if(!host) return;
    host.innerHTML = "";

    const res = current.rubric(score, max);

    const box = document.createElement("div");
    box.className = "results-box";
    box.innerHTML = `
      <h2>${res.title}</h2>
      <div class="score">${score}/${max}</div>
      <div class="message">${res.msg}</div>
      <div style="margin-top:12px">
        <button class="btn" id="btnRetry">Tekrar çöz</button>
        <button class="btn btn-ghost" id="btnBack">Testlere dön</button>
      </div>
    `;
    host.appendChild(box);

    on($("#btnRetry"), "click", () => { step = 0; choice = null; answers = []; renderQuiz(); });
    on($("#btnBack"), "click", () => { location.hash = "#tests"; });
  }

  // —— Routing ——
  function route(){
    const h = location.hash.replace("#","");
    if(h.startsWith("quiz/")){ startQuizById(h.split("/")[1]); }
    else { renderTestList(); }
  }
  document.addEventListener("DOMContentLoaded", route);
  window.addEventListener("hashchange", route);
  document.addEventListener("tests:show", route);
})();
