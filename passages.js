/**
 * Fact-only typing passages by language + difficulty.
 * ASCII-friendly punctuation so keyboard keys match.
 */

const PASSAGES = {
  en: {
    easy: [
      "The Earth is the third planet from the Sun.",
      "Water freezes at zero degrees Celsius.",
      "A day on Earth lasts about twenty-four hours.",
      "The Moon is Earth's only natural satellite.",
      "Honey does not spoil if it is stored well.",
      "Octopuses have three hearts and blue blood.",
      "Bananas are berries, but strawberries are not.",
      "The Pacific Ocean is the largest ocean on Earth.",
      "Light from the Sun takes about eight minutes to reach us.",
      "Adult humans have thirty-two teeth, including wisdom teeth.",
      "The Amazon River carries more water than any other river.",
      "Sharks existed before trees first appeared on land.",
      "A group of flamingos is called a flamboyance.",
      "Mount Everest is the highest mountain above sea level.",
      "The human body is about sixty percent water.",
      "Antarctica is the coldest continent on Earth.",
    ],
    normal: [
      "Venus is the hottest planet in our solar system even though Mercury is closer to the Sun, because a thick atmosphere traps heat.",
      "Your brain uses about twenty percent of your body's energy even though it is only a small part of your total body weight.",
      "There are more trees on Earth than stars in the Milky Way galaxy, based on current scientific estimates of both numbers.",
      "The Great Barrier Reef is the largest living structure on Earth and can be seen from space under good conditions.",
      "Sound travels faster through water than through air because water molecules are packed more closely together.",
      "A year on Mars is about six hundred eighty-seven Earth days long because Mars orbits farther from the Sun.",
      "Lightning is hotter than the surface of the Sun for a brief moment when it flashes through the atmosphere.",
      "The Sahara is the largest hot desert in the world, covering large parts of North Africa across many countries.",
      "Bees can see ultraviolet light, which helps them find patterns on flowers that human eyes cannot see.",
      "The speed of light in a vacuum is about three hundred thousand kilometers per second.",
      "Blue whales are the largest animals known to have ever lived on Earth, bigger than most dinosaurs.",
      "Earth's magnetic field helps protect the planet from charged particles coming from the solar wind.",
      "Diamond is one of the hardest natural materials and is made of carbon atoms arranged in a strong crystal lattice.",
      "The Nile River was long listed as the world's longest river, though some modern measurements debate the ranking with the Amazon.",
      "Koalas sleep for many hours each day because their diet of eucalyptus leaves is low in energy.",
      "The International Space Station orbits Earth about every ninety minutes at a speed of roughly twenty-eight thousand kilometers per hour.",
    ],
    hard: [
      "Jupiter has more than ninety known moons, and its largest moon, Ganymede, is bigger than the planet Mercury.",
      "Photosynthesis converts carbon dioxide and water into sugars and oxygen using energy from sunlight, powering most food chains on Earth.",
      "The Mariana Trench in the Pacific Ocean is the deepest known part of the ocean, reaching depths of nearly eleven kilometers.",
      "DNA is a double helix molecule that stores genetic instructions; humans share a large percentage of genes with many other living species.",
      "Saturn's rings are made mostly of ice particles mixed with rock and dust, ranging from tiny grains to large chunks.",
      "Plate tectonics explains how Earth's crust moves in large plates, causing earthquakes, volcanoes, and the slow drift of continents.",
      "A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape from beyond its event horizon.",
      "The human heart beats about one hundred thousand times per day on average, pumping blood through roughly one hundred thousand kilometers of vessels.",
      "Neutron stars are extremely dense remnants of massive stars; a teaspoon of their material would weigh billions of tons on Earth.",
      "The greenhouse effect is a natural process, but extra carbon dioxide and methane from human activity strengthen warming of the climate.",
      "Coral reefs support roughly twenty-five percent of marine species even though they cover less than one percent of the ocean floor.",
      "The first powered, controlled airplane flight by the Wright brothers took place in 1903 at Kitty Hawk, North Carolina.",
    ],
  },
  tl: {
    easy: [
      "Ang Daigdig ang ikatlong planeta mula sa Araw.",
      "Nagyeyelo ang tubig sa zero degrees Celsius.",
      "May dalawampu't apat na oras ang isang araw sa Daigdig.",
      "Ang Buwan ang tanging natural na satellite ng Daigdig.",
      "Hindi madaling masira ang pulot-pukyutan kung maayos ang pagtatago.",
      "May tatlong puso at asul na dugo ang pugita.",
      "Ang Pasipiko ang pinakamalaking karagatan sa Daigdig.",
      "Humigit-kumulang walong minuto bago makarating sa atin ang liwanag ng Araw.",
      "May tatlumpu't dalawang ngipin ang karaniwang adultong tao.",
      "Ang Bundok Everest ang pinakamataas na bundok sa ibabaw ng dagat.",
      "Halos animnapung porsyento ng katawan ng tao ay tubig.",
      "Ang Antarctica ang pinakamalamig na kontinente sa Daigdig.",
      "Ang Pilipinas ay isang kapuluan sa Timog-Silangang Asya.",
      "May mahigit pitong libong isla ang Pilipinas.",
      "Ang Mayon ay kilala sa halos perpektong hugis-konong bulkan.",
      "Ang palay ang pangunahing pagkain sa maraming bahagi ng Asya.",
    ],
    normal: [
      "Ang Venus ang pinakamainit na planeta sa solar system kahit mas malapit ang Mercury sa Araw, dahil sa makapal nitong atmosphere na humahawak ng init.",
      "Gumagamit ang utak ng tao ng humigit-kumulang dalawampung porsyento ng enerhiya ng katawan kahit maliit lang ang bahagi nito sa bigat.",
      "Mas mabilis maglakbay ang tunog sa tubig kaysa sa hangin dahil mas magkakalapit ang mga molekula ng tubig.",
      "Humigit-kumulang anim na raan walumpu't pitong araw ng Daigdig ang isang taon sa Mars dahil mas malayo ito sa Araw.",
      "Mas mainit pansamantala ang kidlat kaysa sa ibabaw ng Araw sa sandaling dumaan ito sa atmospera.",
      "Ang Sahara ang pinakamalaking mainit na disyerto sa mundo at sumasakop sa malaking bahagi ng Hilagang Aprika.",
      "Nakakakita ang bubuyog ng ultraviolet light na tumutulong sa kanila na makita ang pattern sa bulaklak na hindi nakikita ng mata ng tao.",
      "Ang bilis ng liwanag sa vacuum ay humigit-kumulang tatlong daang libong kilometro bawat segundo.",
      "Ang blue whale ang pinakamalaking hayop na naitala sa kasaysayan ng Daigdig.",
      "Tinutulungan ng magnetic field ng Daigdig na protektahan tayo mula sa charged particles mula sa araw.",
      "Ang diamante ay gawa sa carbon at kabilang sa pinakamatitigas na natural na materyales.",
      "Ang Great Barrier Reef ang pinakamalaking living structure sa Daigdig at makikita minsan mula sa kalawakan.",
      "Ang Taal Volcano ay isa sa mga pinakaaktibong bulkan sa Pilipinas at matatagpuan sa Batangas.",
      "Ang wikang Filipino ay batay sa Tagalog at isa sa mga opisyal na wika ng Pilipinas kasama ang Ingles.",
      "Ang Tubbataha Reef sa Palawan ay isang UNESCO World Heritage Site na mayaman sa marine life.",
      "Ang International Space Station ay umiikot sa Daigdig nang humigit-kumulang bawat siyamnapung minuto.",
    ],
    hard: [
      "May mahigit siyamnapung kilalang buwan ang Jupiter, at mas malaki pa ang pinakamalaki nitong buwan na Ganymede kaysa sa planetang Mercury.",
      "Sa photosynthesis, ginagamit ng halaman ang sikat ng araw upang gawing asukal at oxygen ang carbon dioxide at tubig.",
      "Ang Mariana Trench sa Pasipiko ang pinakamalalim na bahagi ng karagatan, na umaabot ng halos labing-isang kilometro.",
      "Ang DNA ay double helix molecule na nag-iimbak ng genetic instructions para sa paglaki at paggana ng mga organismo.",
      "Halos yelo, bato, at alikabok ang bumubuo sa mga singsing ng Saturn, mula sa maliliit na butil hanggang sa malalaking piraso.",
      "Ipinapaliwanag ng plate tectonics kung paano gumagalaw ang crust ng Daigdig, na nagdudulot ng lindol, bulkan, at pag-anod ng mga kontinente.",
      "Ang black hole ay rehiyon sa spacetime kung saan napakalakas ng gravity kaya wala, maging liwanag man, ang makakatakas lampas sa event horizon.",
      "Tumitibok ang puso ng tao nang humigit-kumulang isang daang libong beses bawat araw at nagpapadaloy ng dugo sa napakahabang network ng ugat.",
      "Lubhang siksik ang neutron star; ang isang kutsarita ng materyal nito ay magpapabigat ng bilyun-bilyong tonelada kung dadalhin sa Daigdig.",
      "Likas ang greenhouse effect, ngunit pinalalakas ito ng dagdag na carbon dioxide at methane mula sa gawain ng tao, na nag-aambag sa climate change.",
      "Sinusuportahan ng coral reefs ang humigit-kumulang dalawampu't limang porsyento ng marine species kahit maliit lang ang bahagi nila sa sahig ng karagatan.",
      "Naganap noong 1903 ang unang controlled powered airplane flight nina Wright brothers sa Kitty Hawk, North Carolina.",
    ],
  },
  es: {
    easy: [
      "La Tierra es el tercer planeta desde el Sol.",
      "El agua se congela a cero grados Celsius.",
      "Un dia en la Tierra dura unas veinticuatro horas.",
      "La Luna es el unico satelite natural de la Tierra.",
      "La miel no se echa a perder si se guarda bien.",
      "Los pulpos tienen tres corazones y sangre azul.",
      "El oceano Pacifico es el mas grande de la Tierra.",
      "La luz del Sol tarda unos ocho minutos en llegar a nosotros.",
      "Los adultos tienen treinta y dos dientes, incluidas las muelas del juicio.",
      "El cuerpo humano es agua en un sesenta por ciento aproximadamente.",
      "La Antartida es el continente mas frio de la Tierra.",
      "El Everest es la montana mas alta sobre el nivel del mar.",
    ],
    normal: [
      "Venus es el planeta mas caliente del sistema solar aunque Mercurio esta mas cerca del Sol, porque su atmosfera atrapa el calor.",
      "El cerebro usa cerca del veinte por ciento de la energia del cuerpo aunque es solo una parte pequena del peso total.",
      "El sonido viaja mas rapido en el agua que en el aire porque las moleculas de agua estan mas juntas.",
      "Un ano en Marte dura unos seiscientos ochenta y siete dias terrestres porque orbita mas lejos del Sol.",
      "Un rayo es mas caliente que la superficie del Sol por un instante cuando cruza la atmosfera.",
      "La velocidad de la luz en el vacio es de unos trescientos mil kilometros por segundo.",
      "Las ballenas azules son los animales mas grandes que han vivido en la Tierra, mas grandes que muchos dinosaurios.",
      "El campo magnetico de la Tierra ayuda a proteger el planeta del viento solar.",
      "El diamante es uno de los materiales naturales mas duros y esta hecho de atomos de carbono.",
      "La Estacion Espacial Internacional orbita la Tierra cada noventa minutos aproximadamente.",
      "El Sahara es el desierto caliente mas grande del mundo y cubre gran parte del norte de Africa.",
      "Las abejas pueden ver luz ultravioleta, lo que les ayuda a encontrar patrones en las flores.",
    ],
    hard: [
      "Jupiter tiene mas de noventa lunas conocidas, y su luna mas grande, Ganymede, es mayor que el planeta Mercurio.",
      "La fotosintesis convierte dioxido de carbono y agua en azucares y oxigeno usando la energia de la luz solar.",
      "La Fosa de las Marianas en el Pacifico es la parte mas profunda del oceano, con casi once kilometros de profundidad.",
      "El ADN es una molecula de doble helice que guarda instrucciones geneticas para el crecimiento y la funcion de los seres vivos.",
      "Los anillos de Saturno estan hechos sobre todo de hielo, roca y polvo, desde granos diminutos hasta trozos grandes.",
      "La tectonica de placas explica como se mueve la corteza terrestre y provoca terremotos, volcanes y la deriva de continentes.",
      "Un agujero negro es una region del espacio-tiempo con gravedad tan fuerte que ni la luz puede escapar mas alla de su horizonte de eventos.",
      "El efecto invernadero es natural, pero el dioxido de carbono y el metano extras de la actividad humana refuerzan el calentamiento.",
      "Los arrecifes de coral sostienen cerca del veinticinco por ciento de las especies marinas aunque cubren menos del uno por ciento del fondo oceanico.",
    ],
  },
  id: {
    easy: [
      "Bumi adalah planet ketiga dari Matahari.",
      "Air membeku pada nol derajat Celsius.",
      "Satu hari di Bumi berlangsung sekitar dua puluh empat jam.",
      "Bulan adalah satelit alami satu-satunya milik Bumi.",
      "Madu tidak mudah rusak jika disimpan dengan baik.",
      "Gurita punya tiga jantung dan darah berwarna biru.",
      "Samudra Pasifik adalah samudra terbesar di Bumi.",
      "Cahaya Matahari butuh sekitar delapan menit untuk sampai ke kita.",
      "Orang dewasa biasanya punya tiga puluh dua gigi.",
      "Tubuh manusia terdiri dari sekitar enam puluh persen air.",
      "Antartika adalah benua paling dingin di Bumi.",
      "Gunung Everest adalah gunung tertinggi di atas permukaan laut.",
    ],
    normal: [
      "Venus adalah planet terpanas di tata surya meskipun Merkurius lebih dekat ke Matahari, karena atmosfernya menahan panas.",
      "Otak memakai sekitar dua puluh persen energi tubuh meski hanya bagian kecil dari berat total.",
      "Suara merambat lebih cepat di air daripada di udara karena molekul air lebih rapat.",
      "Satu tahun di Mars sekitar enam ratus delapan puluh tujuh hari Bumi karena orbitnya lebih jauh dari Matahari.",
      "Petir lebih panas dari permukaan Matahari untuk sekejap saat menyambar di atmosfer.",
      "Kecepatan cahaya di ruang hampa sekitar tiga ratus ribu kilometer per detik.",
      "Paus biru adalah hewan terbesar yang pernah hidup di Bumi, lebih besar dari kebanyakan dinosaurus.",
      "Medan magnet Bumi membantu melindungi planet dari angin matahari.",
      "Intan adalah salah satu material alami paling keras dan terbuat dari atom karbon.",
      "Stasiun Luar Angkasa Internasional mengorbit Bumi sekitar setiap sembilan puluh menit.",
      "Gurun Sahara adalah gurun panas terbesar di dunia dan menutupi sebagian besar Afrika Utara.",
      "Lebah dapat melihat cahaya ultraviolet yang membantu mereka menemukan pola pada bunga.",
    ],
    hard: [
      "Jupiter punya lebih dari sembilan puluh bulan yang diketahui, dan bulan terbesarnya Ganymede lebih besar dari planet Merkurius.",
      "Fotosintesis mengubah karbon dioksida dan air menjadi gula dan oksigen dengan energi cahaya matahari.",
      "Palung Mariana di Pasifik adalah bagian terdalam samudra, mencapai hampir sebelas kilometer.",
      "DNA adalah molekul heliks ganda yang menyimpan instruksi genetik untuk pertumbuhan dan fungsi makhluk hidup.",
      "Cincin Saturnus sebagian besar terbuat dari es, batu, dan debu, dari butiran kecil hingga bongkahan besar.",
      "Tektonik lempeng menjelaskan bagaimana kerak Bumi bergerak dan menyebabkan gempa, gunung berapi, serta pergeseran benua.",
      "Lubang hitam adalah wilayah ruang-waktu dengan gravitasi sangat kuat sehingga bahkan cahaya tidak bisa lepas melampaui horizon peristiwa.",
      "Efek rumah kaca bersifat alami, tetapi karbon dioksida dan metana ekstra dari aktivitas manusia memperkuat pemanasan iklim.",
      "Terumbu karang mendukung sekitar dua puluh lima persen spesies laut meski menutupi kurang dari satu persen dasar samudra.",
    ],
  },
  ja: {
    // Romaji only — works on standard QWERTY without IME
    easy: [
      "Chikyu wa taiyo kara sanno wakusei desu.",
      "Mizu wa zero do Celsius de kogoeru.",
      "Tsuki wa chikyu no yuiitsu no shizen eisei desu.",
      "Hachimitsu wa yoku hokan sureba kowarenikui.",
      "Tako wa shinzo ga mittsu ari, chi wa aoi.",
      "Taiheiyo wa chikyu de mottomo okii kaiyo desu.",
      "Taiyo no hikari ga todoku made yaku hachi fun desu.",
      "Otona no ha wa futsu sanju ni hon aru.",
      "Ningen no karada no yaku rokujuppasento wa mizu desu.",
      "Nankyoku wa chikyu de mottomo samui tairiku desu.",
      "Eberesuto wa kaisui men kara mottomo takai yama desu.",
      "Ichinichi wa yaku niju yon jikan desu.",
    ],
    normal: [
      "Kinsei wa suisei yori taiyo ni chikai noni, atsui wakusei desu. Atsui taiki ga netsu o tojikomeru kara desu.",
      "No wa karada no enerugi no yaku nijuppasento o tsukau ga, taiju no chiisai bubun shika nai.",
      "Oto wa kuki yori mizu no naka de hayaku susumu. Suibunshi ga missetsu dakara desu.",
      "Kasei no ichinen wa yaku roppyaku hachiju nana chikyu nichi de, taiyo kara tooi kara desu.",
      "Kaminari no shunkan ondo wa taiyo hyomen yori takai koto ga aru.",
      "Hikari no sokudo wa shinku de yaku sanju man kiro metoru mai byo desu.",
      "Shiro nagasu kujira wa chikyu de mottomo okii dobutsu to shite shirarete iru.",
      "Chikyu no jiki wa taiyo kaze kara hosho o mamoru no ni yaku datsu.",
      "Daiya wa tanso no kessho de, shizen no naka de mo totemo katai.",
      "Kokusai uchu sutashon wa yaku kyu ju fun goto ni chikyu o mawaru.",
      "Sahara sabaku wa sekai saidai no atsui sabaku de, kita Afurika no okina bubun o oou.",
      "Mitsubachi wa shigai sen o miru koto ga deki, hana no monyo o mitsukeru.",
    ],
    hard: [
      "Mokusei ni wa kyu ju ijo no eisei ga ari, saidai no Ganymede wa Suisei yori okii.",
      "Kogosei wa nisan ka tanso to mizu o to, taiyo enerugi de to to sanso ni kaeru.",
      "Mariana kaikyo wa taiheiyo no mottomo fukai bubun de, yaku ju ichi kiro metoru ni todoku.",
      "DNA wa niju rasen no bunshi de, idenshi joho o takuwaeru.",
      "Dosei no wa wa hyoga to iwa to chiri de dekite iru.",
      "Pureto tekutonikusu wa chikyu hihyo no undo o setsumei shi, jishin ya kazan o okosu.",
      "Burakku horu wa inryoku ga kyoretsu de, hikari sae nukedasenai kukan ryoiki da.",
      "Onshitsu koka wa shizen da ga, ningen katsudo no nisan ka tanso ya metan ga ondan ka o tsuyomeru.",
      "Sango sho wa kaiyo seibutsu no yaku niju go pasento o sasaeru ga, kaitei no ichi pasento miman shika nai.",
    ],
  },
  pt: {
    easy: [
      "A Terra e o terceiro planeta a partir do Sol.",
      "A agua congela a zero graus Celsius.",
      "Um dia na Terra dura cerca de vinte e quatro horas.",
      "A Lua e o unico satelite natural da Terra.",
      "O mel nao estraga se for guardado bem.",
      "Os polvos tem tres coracoes e sangue azul.",
      "O Oceano Pacifico e o maior oceano da Terra.",
      "A luz do Sol demora cerca de oito minutos para chegar ate nos.",
      "Adultos tem trinta e dois dentes, incluindo os do siso.",
      "O corpo humano tem cerca de sessenta por cento de agua.",
      "A Antartida e o continente mais frio da Terra.",
      "O Everest e a montanha mais alta acima do nivel do mar.",
    ],
    normal: [
      "Venus e o planeta mais quente do sistema solar mesmo com Mercurio mais perto do Sol, porque a atmosfera retem o calor.",
      "O cerebro usa cerca de vinte por cento da energia do corpo embora seja so uma pequena parte do peso total.",
      "O som viaja mais rapido na agua do que no ar porque as moleculas de agua ficam mais juntas.",
      "Um ano em Marte dura cerca de seiscentos e oitenta e sete dias terrestres porque orbita mais longe do Sol.",
      "Um raio e mais quente que a superficie do Sol por um instante quando atravessa a atmosfera.",
      "A velocidade da luz no vacuo e cerca de trezentos mil quilometros por segundo.",
      "As baleias azuis sao os maiores animais que ja viveram na Terra, maiores que muitos dinossauros.",
      "O campo magnetico da Terra ajuda a proteger o planeta do vento solar.",
      "O diamante e um dos materiais naturais mais duros e e feito de atomos de carbono.",
      "A Estacao Espacial Internacional orbita a Terra a cada cerca de noventa minutos.",
      "O Saara e o maior deserto quente do mundo e cobre grande parte do norte da Africa.",
      "As abelhas podem ver luz ultravioleta, o que as ajuda a achar padroes nas flores.",
    ],
    hard: [
      "Jupiter tem mais de noventa luas conhecidas, e sua maior lua, Ganymede, e maior que o planeta Mercurio.",
      "A fotossintese converte dioxido de carbono e agua em acucares e oxigenio usando a energia da luz solar.",
      "A Fossa das Marianas no Pacifico e a parte mais profunda do oceano, com quase onze quilometros de profundidade.",
      "O DNA e uma molecula de dupla helice que guarda instrucoes geneticas para o crescimento e a funcao dos seres vivos.",
      "Os aneis de Saturno sao feitos sobretudo de gelo, rocha e poeira, de graos minimos a pedacos grandes.",
      "A tectonica de placas explica como a crosta da Terra se move e causa terremotos, vulcoes e a deriva dos continentes.",
      "Um buraco negro e uma regiao do espaco-tempo com gravidade tao forte que nem a luz escapa alem do horizonte de eventos.",
      "O efeito estufa e natural, mas o dioxido de carbono e o metano extras da atividade humana reforcam o aquecimento.",
      "Os recifes de coral sustentam cerca de vinte e cinco por cento das especies marinhas embora cubram menos de um por cento do fundo do oceano.",
    ],
  },
  fr: {
    easy: [
      "La Terre est la troisieme planete a partir du Soleil.",
      "L'eau gele a zero degre Celsius.",
      "Un jour sur Terre dure environ vingt-quatre heures.",
      "La Lune est le seul satellite naturel de la Terre.",
      "Le miel ne se gate pas s'il est bien conserve.",
      "Les pieuvres ont trois coeurs et du sang bleu.",
      "L'ocean Pacifique est le plus grand ocean de la Terre.",
      "La lumiere du Soleil met environ huit minutes pour nous atteindre.",
      "Les adultes ont trente-deux dents, y compris les dents de sagesse.",
      "Le corps humain est compose d'environ soixante pour cent d'eau.",
      "L'Antarctique est le continent le plus froid de la Terre.",
      "L'Everest est la montagne la plus haute au-dessus du niveau de la mer.",
    ],
    normal: [
      "Venus est la planete la plus chaude du systeme solaire meme si Mercure est plus proche du Soleil, car son atmosphere retient la chaleur.",
      "Le cerveau utilise environ vingt pour cent de l'energie du corps bien qu'il ne soit qu'une petite partie du poids total.",
      "Le son voyage plus vite dans l'eau que dans l'air car les molecules d'eau sont plus serrees.",
      "Une annee sur Mars dure environ six cent quatre-vingt-sept jours terrestres car elle orbite plus loin du Soleil.",
      "Un eclair est plus chaud que la surface du Soleil un instant quand il traverse l'atmosphere.",
      "La vitesse de la lumiere dans le vide est d'environ trois cent mille kilometres par seconde.",
      "Les baleines bleues sont les plus grands animaux connus a avoir vecu sur Terre, plus grandes que beaucoup de dinosaures.",
      "Le champ magnetique de la Terre aide a proteger la planete du vent solaire.",
      "Le diamant est l'un des materiaux naturels les plus durs et est fait d'atomes de carbone.",
      "La Station spatiale internationale orbite la Terre environ toutes les quatre-vingt-dix minutes.",
      "Le Sahara est le plus grand desert chaud du monde et couvre une grande partie de l'Afrique du Nord.",
      "Les abeilles peuvent voir la lumiere ultraviolette, ce qui les aide a trouver des motifs sur les fleurs.",
    ],
    hard: [
      "Jupiter a plus de quatre-vingt-dix lunes connues, et sa plus grande lune, Ganymede, est plus grande que la planete Mercure.",
      "La photosynthese convertit le dioxyde de carbone et l'eau en sucres et en oxygene grace a l'energie de la lumiere du soleil.",
      "La fosse des Mariannes dans le Pacifique est la partie la plus profonde de l'ocean, avec presque onze kilometres de profondeur.",
      "L'ADN est une molecule en double helice qui stocke les instructions genetiques pour la croissance et le fonctionnement des etres vivants.",
      "Les anneaux de Saturne sont surtout faits de glace, de roche et de poussiere, des grains minuscules aux gros morceaux.",
      "La tectonique des plaques explique comment la croute terrestre se deplace et provoque seismes, volcans et derive des continents.",
      "Un trou noir est une region de l'espace-temps ou la gravite est si forte que meme la lumiere ne peut s'echapper au-dela de l'horizon des evenements.",
      "L'effet de serre est naturel, mais le dioxyde de carbone et le methane en trop de l'activite humaine renforcent le rechauffement.",
      "Les recifs coralliens soutiennent environ vingt-cinq pour cent des especes marines bien qu'ils couvrent moins d'un pour cent du fond oceanique.",
    ],
  },
  de: {
    easy: [
      "Die Erde ist der dritte Planet von der Sonne.",
      "Wasser gefriert bei null Grad Celsius.",
      "Ein Tag auf der Erde dauert etwa vierundzwanzig Stunden.",
      "Der Mond ist der einzige natuerliche Satellit der Erde.",
      "Honig verdirbt nicht, wenn er gut gelagert wird.",
      "Oktopusse haben drei Herzen und blaues Blut.",
      "Der Pazifik ist der groesste Ozean der Erde.",
      "Licht von der Sonne braucht etwa acht Minuten bis zu uns.",
      "Erwachsene haben zweiunddreissig Zaehne, inklusive Weisheitszaehne.",
      "Der menschliche Koerper besteht zu etwa sechzig Prozent aus Wasser.",
      "Die Antarktis ist der kaelteste Kontinent der Erde.",
      "Der Everest ist der hoechste Berg ueber dem Meeresspiegel.",
    ],
    normal: [
      "Venus ist der heisseste Planet im Sonnensystem, obwohl Merkur der Sonne naeher ist, weil die dicke Atmosphaere Hitze speichert.",
      "Das Gehirn nutzt etwa zwanzig Prozent der Koerperenergie, obwohl es nur einen kleinen Teil des Gesamtgewichts ausmacht.",
      "Schall reist im Wasser schneller als in Luft, weil Wassermolekuele dichter gepackt sind.",
      "Ein Jahr auf dem Mars dauert etwa sechshundertsiebenundachtzig Erdtage, weil er weiter von der Sonne entfernt kreist.",
      "Ein Blitz ist fuer einen Moment heisser als die Sonnenoberflaeche, wenn er durch die Atmosphaere faehrt.",
      "Die Lichtgeschwindigkeit im Vakuum betraegt etwa dreihunderttausend Kilometer pro Sekunde.",
      "Blauwale sind die groessten Tiere, die je auf der Erde gelebt haben, groesser als die meisten Dinosaurier.",
      "Das Magnetfeld der Erde schuetzt den Planeten vor dem Sonnenwind.",
      "Diamant ist eines der haertesten natuerlichen Materialien und besteht aus Kohlenstoffatomen.",
      "Die Internationale Raumstation umkreist die Erde etwa alle neunzig Minuten.",
      "Die Sahara ist die groesste heisse Wueste der Welt und bedeckt grosse Teile Nordafrikas.",
      "Bienen koennen ultraviolettes Licht sehen und so Muster auf Blumen finden.",
    ],
    hard: [
      "Jupiter hat mehr als neunzig bekannte Monde, und sein groesster Mond Ganymede ist groesser als der Planet Merkur.",
      "Photosynthese wandelt Kohlenstoffdioxid und Wasser mit Sonnenenergie in Zucker und Sauerstoff um.",
      "Der Marianengraben im Pazifik ist der tiefste bekannte Teil des Ozeans und erreicht fast elf Kilometer.",
      "DNA ist ein Doppelhelix-Molekuel, das genetische Anweisungen fuer Wachstum und Funktion von Lebewesen speichert.",
      "Die Ringe des Saturn bestehen vor allem aus Eis, Gestein und Staub, von winzigen Koernern bis zu grossen Brocken.",
      "Platten tektonik erklaert, wie sich die Erdkruste bewegt und Erdbeben, Vulkane und Kontinentaldrift verursacht.",
      "Ein schwarzes Loch ist ein Bereich der Raumzeit mit so starker Schwerkraft, dass nicht einmal Licht jenseits des Ereignishorizonts entkommen kann.",
      "Der Treibhauseffekt ist natuerlich, aber zusaetzliches Kohlenstoffdioxid und Methan aus menschlicher Aktivitaet verstaerken die Erwaermung.",
      "Korallenriffe unterstuetzen etwa fuenfundzwanzig Prozent der Meeresarten, obwohl sie weniger als ein Prozent des Meeresbodens bedecken.",
    ],
  },
};

const LANGUAGES = ["en", "tl", "es", "id", "ja", "pt", "fr", "de"];
const DIFFICULTIES = ["easy", "normal", "hard"];

const LANG_LABELS = {
  en: "English",
  tl: "Tagalog",
  es: "Spanish",
  id: "Indonesian",
  ja: "Japanese",
  pt: "Portuguese",
  fr: "French",
  de: "German",
};

/** Fact topic packs (separate from difficulty tiers). */
const CATEGORIES = {
  all: { id: "all", label: "All Facts", short: "All" },
  science: { id: "science", label: "Science", short: "Sci" },
  space: { id: "space", label: "Space", short: "Space" },
  animals: { id: "animals", label: "Animals", short: "Animals" },
  ph: { id: "ph", label: "Philippines", short: "PH" },
};

const CATEGORY_IDS = Object.keys(CATEGORIES);

/**
 * Category-specific facts by language + difficulty.
 * "all" uses the main PASSAGES pool.
 */
const CATEGORY_PASSAGES = {
  en: {
    science: {
      easy: [
        "Water freezes at zero degrees Celsius.",
        "Honey does not spoil if it is stored well.",
        "The human body is about sixty percent water.",
        "Adult humans have thirty-two teeth, including wisdom teeth.",
        "Diamond is made of carbon atoms in a strong crystal lattice.",
      ],
      normal: [
        "Your brain uses about twenty percent of your body's energy even though it is only a small part of your total body weight.",
        "Sound travels faster through water than through air because water molecules are packed more closely together.",
        "Lightning is hotter than the surface of the Sun for a brief moment when it flashes through the atmosphere.",
        "Bees can see ultraviolet light, which helps them find patterns on flowers that human eyes cannot see.",
        "DNA stores genetic instructions; humans share a large percentage of genes with many other living species.",
      ],
      hard: [
        "Photosynthesis converts carbon dioxide and water into sugars and oxygen using energy from sunlight, powering most food chains on Earth.",
        "Plate tectonics explains how Earth's crust moves in large plates, causing earthquakes, volcanoes, and the slow drift of continents.",
        "The greenhouse effect is a natural process, but extra carbon dioxide and methane from human activity strengthen warming of the climate.",
        "The human heart beats about one hundred thousand times per day on average, pumping blood through roughly one hundred thousand kilometers of vessels.",
      ],
    },
    space: {
      easy: [
        "The Earth is the third planet from the Sun.",
        "The Moon is Earth's only natural satellite.",
        "Light from the Sun takes about eight minutes to reach us.",
        "A day on Earth lasts about twenty-four hours.",
      ],
      normal: [
        "Venus is the hottest planet in our solar system even though Mercury is closer to the Sun, because a thick atmosphere traps heat.",
        "A year on Mars is about six hundred eighty-seven Earth days long because Mars orbits farther from the Sun.",
        "The speed of light in a vacuum is about three hundred thousand kilometers per second.",
        "The International Space Station orbits Earth about every ninety minutes at a speed of roughly twenty-eight thousand kilometers per hour.",
        "Earth's magnetic field helps protect the planet from charged particles coming from the solar wind.",
      ],
      hard: [
        "Jupiter has more than ninety known moons, and its largest moon, Ganymede, is bigger than the planet Mercury.",
        "Saturn's rings are made mostly of ice particles mixed with rock and dust, ranging from tiny grains to large chunks.",
        "A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape from beyond its event horizon.",
        "Neutron stars are extremely dense remnants of massive stars; a teaspoon of their material would weigh billions of tons on Earth.",
      ],
    },
    animals: {
      easy: [
        "Octopuses have three hearts and blue blood.",
        "A group of flamingos is called a flamboyance.",
        "Sharks existed before trees first appeared on land.",
        "Bananas are berries, but strawberries are not.",
      ],
      normal: [
        "Blue whales are the largest animals known to have ever lived on Earth, bigger than most dinosaurs.",
        "Koalas sleep for many hours each day because their diet of eucalyptus leaves is low in energy.",
        "The Great Barrier Reef is the largest living structure on Earth and can be seen from space under good conditions.",
        "There are more trees on Earth than stars in the Milky Way galaxy, based on current scientific estimates of both numbers.",
      ],
      hard: [
        "Coral reefs support roughly twenty-five percent of marine species even though they cover less than one percent of the ocean floor.",
        "The Mariana Trench in the Pacific Ocean is the deepest known part of the ocean, reaching depths of nearly eleven kilometers.",
        "The Amazon River carries more water than any other river on Earth and supports enormous biodiversity.",
      ],
    },
    ph: {
      easy: [
        "The Philippines is an archipelago in Southeast Asia.",
        "The Philippines has more than seven thousand islands.",
        "Mayon Volcano is known for its nearly perfect cone shape.",
        "Rice is a staple food in many parts of the Philippines.",
      ],
      normal: [
        "Taal Volcano is one of the most active volcanoes in the Philippines and is located in Batangas.",
        "Tubbataha Reef in Palawan is a UNESCO World Heritage Site rich in marine life.",
        "Filipino is based on Tagalog and is one of the official languages of the Philippines along with English.",
        "The Philippines sits on the Pacific Ring of Fire, which explains its many volcanoes and earthquakes.",
      ],
      hard: [
        "The Philippine Deep is one of the deepest oceanic trenches in the world and is found east of the archipelago.",
        "Manila was a major trading hub for centuries, connecting Asian and European commerce through galleon trade routes.",
        "The Philippines has some of the highest marine biodiversity on Earth, especially in the Coral Triangle region.",
      ],
    },
  },
  tl: {
    science: {
      easy: [
        "Nagyeyelo ang tubig sa zero degrees Celsius.",
        "Halos animnapung porsyento ng katawan ng tao ay tubig.",
        "May tatlumpu't dalawang ngipin ang karaniwang adultong tao.",
        "Hindi madaling masira ang pulot-pukyutan kung maayos ang pagtatago.",
      ],
      normal: [
        "Gumagamit ang utak ng tao ng humigit-kumulang dalawampung porsyento ng enerhiya ng katawan kahit maliit lang ang bahagi nito sa bigat.",
        "Mas mabilis maglakbay ang tunog sa tubig kaysa sa hangin dahil mas magkakalapit ang mga molekula ng tubig.",
        "Mas mainit pansamantala ang kidlat kaysa sa ibabaw ng Araw sa sandaling dumaan ito sa atmospera.",
        "Ang diamante ay gawa sa carbon at kabilang sa pinakamatitigas na natural na materyales.",
      ],
      hard: [
        "Sa photosynthesis, ginagamit ng halaman ang sikat ng araw upang gawing asukal at oxygen ang carbon dioxide at tubig.",
        "Ipinapaliwanag ng plate tectonics kung paano gumagalaw ang crust ng Daigdig, na nagdudulot ng lindol, bulkan, at pag-anod ng mga kontinente.",
        "Likas ang greenhouse effect, ngunit pinalalakas ito ng dagdag na carbon dioxide at methane mula sa gawain ng tao.",
        "Ang DNA ay double helix molecule na nag-iimbak ng genetic instructions para sa paglaki at paggana ng mga organismo.",
      ],
    },
    space: {
      easy: [
        "Ang Daigdig ang ikatlong planeta mula sa Araw.",
        "Ang Buwan ang tanging natural na satellite ng Daigdig.",
        "Humigit-kumulang walong minuto bago makarating sa atin ang liwanag ng Araw.",
        "May dalawampu't apat na oras ang isang araw sa Daigdig.",
      ],
      normal: [
        "Ang Venus ang pinakamainit na planeta sa solar system kahit mas malapit ang Mercury sa Araw, dahil sa makapal nitong atmosphere.",
        "Humigit-kumulang anim na raan walumpu't pitong araw ng Daigdig ang isang taon sa Mars.",
        "Ang bilis ng liwanag sa vacuum ay humigit-kumulang tatlong daang libong kilometro bawat segundo.",
        "Ang International Space Station ay umiikot sa Daigdig nang humigit-kumulang bawat siyamnapung minuto.",
      ],
      hard: [
        "May mahigit siyamnapung kilalang buwan ang Jupiter, at mas malaki pa ang pinakamalaki nitong buwan na Ganymede kaysa sa planetang Mercury.",
        "Halos yelo, bato, at alikabok ang bumubuo sa mga singsing ng Saturn.",
        "Ang black hole ay rehiyon sa spacetime kung saan napakalakas ng gravity kaya wala, maging liwanag man, ang makakatakas.",
        "Lubhang siksik ang neutron star; ang isang kutsarita ng materyal nito ay magpapabigat ng bilyun-bilyong tonelada sa Daigdig.",
      ],
    },
    animals: {
      easy: [
        "May tatlong puso at asul na dugo ang pugita.",
        "Ang blue whale ang pinakamalaking hayop na naitala sa kasaysayan ng Daigdig.",
      ],
      normal: [
        "Nakakakita ang bubuyog ng ultraviolet light na tumutulong sa kanila na makita ang pattern sa bulaklak.",
        "Ang Great Barrier Reef ang pinakamalaking living structure sa Daigdig at makikita minsan mula sa kalawakan.",
        "Tinutulungan ng magnetic field ng Daigdig na protektahan tayo mula sa charged particles mula sa araw.",
      ],
      hard: [
        "Sinusuportahan ng coral reefs ang humigit-kumulang dalawampu't limang porsyento ng marine species kahit maliit lang ang bahagi nila sa karagatan.",
        "Ang Mariana Trench sa Pasipiko ang pinakamalalim na bahagi ng karagatan, na umaabot ng halos labing-isang kilometro.",
      ],
    },
    ph: {
      easy: [
        "Ang Pilipinas ay isang kapuluan sa Timog-Silangang Asya.",
        "May mahigit pitong libong isla ang Pilipinas.",
        "Ang Mayon ay kilala sa halos perpektong hugis-konong bulkan.",
        "Ang palay ang pangunahing pagkain sa maraming bahagi ng Pilipinas.",
      ],
      normal: [
        "Ang Taal Volcano ay isa sa mga pinakaaktibong bulkan sa Pilipinas at matatagpuan sa Batangas.",
        "Ang Tubbataha Reef sa Palawan ay isang UNESCO World Heritage Site na mayaman sa marine life.",
        "Ang wikang Filipino ay batay sa Tagalog at isa sa mga opisyal na wika ng Pilipinas kasama ang Ingles.",
        "Nasa Pacific Ring of Fire ang Pilipinas, kaya marami itong bulkan at lindol.",
      ],
      hard: [
        "Ang Philippine Deep ay kabilang sa pinakamalalim na trench sa mundo at matatagpuan sa silangan ng kapuluan.",
        "Ang Pilipinas ay bahagi ng Coral Triangle, isa sa mga sentro ng pinakamataas na marine biodiversity sa daigdig.",
        "Sa loob ng maraming siglo, naging mahalagang sentro ng kalakalan ang Maynila sa galleon trade sa pagitan ng Asya at Europa.",
      ],
    },
  },
};

const MODES = {
  classic: {
    id: "classic",
    label: "Classic",
    short: "Race",
    description: "Finish the passage first. Clean and fast.",
  },
  best_of_3: {
    id: "best_of_3",
    label: "Best of 3",
    short: "Bo3",
    description: "First to 2 race wins takes the series.",
  },
  timed: {
    id: "timed",
    label: "Timed 60s",
    short: "60s",
    description: "Type as far as you can in 60 seconds.",
  },
  sudden_death: {
    id: "sudden_death",
    label: "Sudden Death",
    short: "SD",
    description: "One mistake and you are out.",
  },
  ghost: {
    id: "ghost",
    label: "Ghost Race",
    short: "Ghost",
    description: "Race a ghost at your last WPM pace.",
  },
  team: {
    id: "team",
    label: "Team 2v2",
    short: "2v2",
    description: "Two teams. Win by average progress and WPM.",
  },
  words: {
    id: "words",
    label: "Word Mode",
    short: "Words",
    description: "Type random words instead of fact paragraphs.",
  },
};

/** Word banks for Word Mode (ASCII only). */
const WORDS = {
  en: {
    easy: [
      "cat", "dog", "sun", "moon", "tree", "fish", "bird", "book", "rain", "star",
      "water", "earth", "light", "plant", "ocean", "cloud", "river", "stone", "green", "blue",
      "apple", "house", "music", "happy", "quick", "world", "space", "metal", "paper", "glass",
      "bread", "sugar", "honey", "tiger", "horse", "sheep", "mouse", "lemon", "grape", "peach",
    ],
    normal: [
      "planet", "galaxy", "oxygen", "carbon", "energy", "nature", "animal", "forest", "island", "valley",
      "science", "gravity", "magnet", "crystal", "volcano", "weather", "climate", "thunder", "comet", "orbit",
      "protein", "vitamin", "bacteria", "fossil", "mineral", "glacier", "desert", "jungle", "meadow", "canyon",
      "satellite", "atmosphere", "molecule", "element", "nucleus", "electron", "photon", "spectrum", "habitat", "species",
    ],
    hard: [
      "photosynthesis", "constellation", "hemisphere", "equator", "longitude", "latitude", "tectonic", "sediment",
      "metamorphosis", "biodiversity", "ecosystem", "chromosome", "mitochondria", "evaporation", "condensation",
      "fluorescence", "infrared", "ultraviolet", "acceleration", "momentum", "velocity", "trajectory", "parallax",
      "hypothesis", "experiment", "observation", "microscopic", "macroscopic", "circumference", "perpendicular",
    ],
  },
  tl: {
    easy: [
      "aso", "pusa", "araw", "buwan", "ulan", "hangin", "tubig", "lupa", "bato", "dagat",
      "ilog", "bundok", "puno", "dahon", "bulaklak", "ibon", "isda", "ulap", "bituin", "gabi",
      "umaga", "bahay", "bata", "aalis", "kain", "inom", "tulog", "lakad", "takbo", "tawa",
      "saging", "mangga", "kanin", "tinapay", "gatas", "asukal", "asin", "luto", "init", "lamig",
    ],
    normal: [
      "planeta", "kalawakan", "likas", "hayop", "halaman", "kagubatan", "pulo", "lambak", "bulkan", "lindol",
      "kidlat", "kulog", "bagyo", "klima", "hangganan", "kapuluan", "bansa", "lungsod", "baryo", "daan",
      "agham", "enerhiya", "grabidad", "oxygen", "carbon", "mineral", "kristal", "fossil", "habitat", "uri",
      "satellite", "atmospera", "molekula", "elemento", "nucleus", "electron", "liwanag", "tunog", "init", "presyon",
    ],
    hard: [
      "potosintesis", "konstelasyon", "hemisphere", "ekwador", "longhitud", "latitud", "tektoniko", "sediment",
      "metamorphosis", "biodiversity", "ekosistema", "chromosome", "mitochondria", "ebaporasyon", "kondensasyon",
      "fluorescence", "infrared", "ultraviolet", "akselerasyon", "momentum", "belosidad", "trajectory", "hypothesis",
      "eksperimento", "obserbasyon", "mikroskopiko", "makroskopiko", "sirkumperensiya", "perpendikular", "gravitasyon",
    ],
  },
  es: {
    easy: [
      "gato", "perro", "sol", "luna", "agua", "tierra", "fuego", "aire", "mar", "rio",
      "arbol", "flor", "libro", "casa", "mesa", "silla", "pan", "leche", "queso", "fruta",
      "rojo", "azul", "verde", "negro", "blanco", "grande", "chico", "rapido", "lento", "feliz",
      "noche", "dia", "hora", "minuto", "ciudad", "pueblo", "camino", "puente", "playa", "monte",
    ],
    normal: [
      "planeta", "galaxia", "oxigeno", "energia", "ciencia", "gravedad", "volcan", "clima", "orbita", "cometa",
      "bosque", "desierto", "isla", "valle", "cristal", "mineral", "fosiles", "habitat", "especie", "atomo",
      "molecula", "atmosfera", "satelite", "oceano", "glaciar", "trueno", "rayo", "nube", "viento", "tormenta",
      "proteina", "vitamina", "bacteria", "nucleo", "electron", "fotones", "espectro", "magneto", "carbono", "nitrogeno",
    ],
    hard: [
      "fotosintesis", "constelacion", "hemisferio", "ecuador", "longitud", "latitud", "tectonica", "sedimento",
      "biodiversidad", "ecosistema", "cromosoma", "mitocondria", "evaporacion", "condensacion", "ultravioleta",
      "aceleracion", "momento", "velocidad", "trayectoria", "hipotesis", "experimento", "observacion", "microscopico",
      "macroscopico", "circunferencia", "perpendicular", "gravitacion", "atmosfera", "fluorescencia", "infrarrojo",
    ],
  },
  id: {
    easy: [
      "kucing", "anjing", "matahari", "bulan", "air", "tanah", "api", "udara", "laut", "sungai",
      "pohon", "bunga", "buku", "rumah", "meja", "kursi", "roti", "susu", "keju", "buah",
      "merah", "biru", "hijau", "hitam", "putih", "besar", "kecil", "cepat", "lambat", "senang",
      "malam", "siang", "jam", "menit", "kota", "desa", "jalan", "jembatan", "pantai", "gunung",
    ],
    normal: [
      "planet", "galaksi", "oksigen", "energi", "sains", "gravitasi", "gunung", "iklim", "orbit", "komet",
      "hutan", "gurun", "pulau", "lembah", "kristal", "mineral", "fosil", "habitat", "spesies", "atom",
      "molekul", "atmosfer", "satelit", "samudra", "gletser", "guntur", "petir", "awan", "angin", "badai",
      "protein", "vitamin", "bakteri", "inti", "elektron", "foton", "spektrum", "magnet", "karbon", "nitrogen",
    ],
    hard: [
      "fotosintesis", "rasi", "hemisfer", "khatulistiwa", "bujur", "lintang", "tektonik", "sedimen",
      "biodiversitas", "ekosistem", "kromosom", "mitokondria", "evaporasi", "kondensasi", "ultraviolet",
      "akselerasi", "momentum", "kecepatan", "trajektori", "hipotesis", "eksperimen", "observasi", "mikroskopis",
      "makroskopis", "keliling", "tegak", "gravitasi", "atmosfer", "fluoresensi", "inframerah",
    ],
  },
  ja: {
    easy: [
      "neko", "inu", "taiyo", "tsuki", "mizu", "tsuchi", "hi", "kuki", "umi", "kawa",
      "ki", "hana", "hon", "ie", "tsukue", "isu", "pan", "gyunyu", "chizu", "kudamono",
      "aka", "ao", "midori", "kuro", "shiro", "ookii", "chiisai", "hayai", "osoi", "ureshii",
      "yoru", "hiru", "jikan", "fun", "machi", "mura", "michi", "hashi", "hama", "yama",
    ],
    normal: [
      "wakusei", "ginga", "sanso", "enerugi", "kagaku", "juryoku", "kazan", "kiko", "kido", "suisei",
      "mori", "sabaku", "shima", "tani", "kessho", "kobutsu", "kaseki", "sumika", "shushu", "genshi",
      "bunshi", "taiki", "eisei", "kaiyo", "hyoga", "kaminari", "inazuma", "kumo", "kaze", "arashi",
      "tanpaku", "bitamin", "saikin", "kaku", "denshi", "koushi", "bunko", "jishaku", "tanso", "chisso",
    ],
    hard: [
      "kogosei", "seiza", "hankyu", "sekido", "keido", "ido", "pureto", "taisekibutsu",
      "tayosei", "seitaikei", "senshokutai", "mitokondoria", "johatsu", "gyoshuku", "shigaisen",
      "kasoku", "undoryo", "sokudo", "kidou", "kasetsu", "jikken", "kansatsu", "bikanshi",
      "daikibo", "enshu", "suichoku", "juryoku", "taikiken", "keiko", "sekigaisen",
    ],
  },
  pt: {
    easy: [
      "gato", "cao", "sol", "lua", "agua", "terra", "fogo", "ar", "mar", "rio",
      "arvore", "flor", "livro", "casa", "mesa", "cadeira", "pao", "leite", "queijo", "fruta",
      "vermelho", "azul", "verde", "preto", "branco", "grande", "pequeno", "rapido", "lento", "feliz",
      "noite", "dia", "hora", "minuto", "cidade", "vila", "estrada", "ponte", "praia", "monte",
    ],
    normal: [
      "planeta", "galaxia", "oxigenio", "energia", "ciencia", "gravidade", "vulcao", "clima", "orbita", "cometa",
      "floresta", "deserto", "ilha", "vale", "cristal", "mineral", "fossil", "habitat", "especie", "atomo",
      "molecula", "atmosfera", "satelite", "oceano", "geleira", "trovao", "raio", "nuvem", "vento", "tempestade",
      "proteina", "vitamina", "bacteria", "nucleo", "eletron", "foton", "espectro", "ima", "carbono", "nitrogenio",
    ],
    hard: [
      "fotossintese", "constelacao", "hemisferio", "equador", "longitude", "latitude", "tectonica", "sedimento",
      "biodiversidade", "ecossistema", "cromossomo", "mitocondria", "evaporacao", "condensacao", "ultravioleta",
      "aceleracao", "momento", "velocidade", "trajetoria", "hipotese", "experimento", "observacao", "microscopico",
      "macroscopico", "circunferencia", "perpendicular", "gravitacao", "atmosfera", "fluorescencia", "infravermelho",
    ],
  },
  fr: {
    easy: [
      "chat", "chien", "soleil", "lune", "eau", "terre", "feu", "air", "mer", "riviere",
      "arbre", "fleur", "livre", "maison", "table", "chaise", "pain", "lait", "fromage", "fruit",
      "rouge", "bleu", "vert", "noir", "blanc", "grand", "petit", "rapide", "lent", "heureux",
      "nuit", "jour", "heure", "minute", "ville", "village", "route", "pont", "plage", "mont",
    ],
    normal: [
      "planete", "galaxie", "oxygene", "energie", "science", "gravite", "volcan", "climat", "orbite", "comete",
      "foret", "desert", "ile", "vallee", "cristal", "mineral", "fossile", "habitat", "espece", "atome",
      "molecule", "atmosphere", "satellite", "ocean", "glacier", "tonnerre", "eclair", "nuage", "vent", "tempete",
      "proteine", "vitamine", "bacterie", "noyau", "electron", "photon", "spectre", "aimant", "carbone", "azote",
    ],
    hard: [
      "photosynthese", "constellation", "hemisphere", "equateur", "longitude", "latitude", "tectonique", "sediment",
      "biodiversite", "ecosysteme", "chromosome", "mitochondrie", "evaporation", "condensation", "ultraviolet",
      "acceleration", "moment", "vitesse", "trajectoire", "hypothese", "experience", "observation", "microscopique",
      "macroscopique", "circonference", "perpendiculaire", "gravitation", "atmosphere", "fluorescence", "infrarouge",
    ],
  },
  de: {
    easy: [
      "katze", "hund", "sonne", "mond", "wasser", "erde", "feuer", "luft", "meer", "fluss",
      "baum", "blume", "buch", "haus", "tisch", "stuhl", "brot", "milch", "kaese", "obst",
      "rot", "blau", "gruen", "schwarz", "weiss", "gross", "klein", "schnell", "langsam", "froh",
      "nacht", "tag", "stunde", "minute", "stadt", "dorf", "strasse", "bruecke", "strand", "berg",
    ],
    normal: [
      "planet", "galaxie", "sauerstoff", "energie", "wissenschaft", "schwerkraft", "vulkan", "klima", "orbit", "komet",
      "wald", "wueste", "insel", "tal", "kristall", "mineral", "fossil", "lebensraum", "art", "atom",
      "molekuel", "atmosphaere", "satellit", "ozean", "gletscher", "donner", "blitz", "wolke", "wind", "sturm",
      "protein", "vitamin", "bakterie", "kern", "elektron", "photon", "spektrum", "magnet", "kohlenstoff", "stickstoff",
    ],
    hard: [
      "photosynthese", "sternbild", "hemisphaere", "aequator", "laenge", "breite", "tektonik", "sediment",
      "biodiversitaet", "oekosystem", "chromosom", "mitochondrien", "verdunstung", "kondensation", "ultraviolett",
      "beschleunigung", "impuls", "geschwindigkeit", "bahn", "hypothese", "experiment", "beobachtung", "mikroskopisch",
      "makroskopisch", "umfang", "senkrecht", "gravitation", "atmosphaere", "fluoreszenz", "infrarot",
    ],
  },
};

function normalizeLanguage(value) {
  const l = String(value || "en").toLowerCase().trim();
  if (l === "fil" || l === "tagalog" || l === "filipino") return "tl";
  if (l === "english" || l === "eng") return "en";
  if (l === "spanish" || l === "espanol" || l === "español") return "es";
  if (l === "indonesian" || l === "bahasa" || l === "bahasa_indonesia") return "id";
  if (l === "japanese" || l === "nihongo" || l === "jp") return "ja";
  if (l === "portuguese" || l === "portugues" || l === "português" || l === "br") return "pt";
  if (l === "french" || l === "francais" || l === "français") return "fr";
  if (l === "german" || l === "deutsch") return "de";
  return LANGUAGES.includes(l) ? l : "en";
}

function normalizeDifficulty(value) {
  const d = String(value || "normal").toLowerCase();
  return DIFFICULTIES.includes(d) ? d : "normal";
}

function normalizeMode(value) {
  const m = String(value || "classic").toLowerCase().replace(/\s+/g, "_");
  if (m === "bo3" || m === "bestof3") return "best_of_3";
  if (m === "60" || m === "timed60" || m === "time") return "timed";
  if (m === "sd" || m === "sudden" || m === "death") return "sudden_death";
  if (m === "ghost_race" || m === "handicap") return "ghost";
  if (m === "2v2" || m === "teams" || m === "team_mode") return "team";
  if (m === "word" || m === "word_mode" || m === "random_words") return "words";
  return MODES[m] ? m : "classic";
}

function normalizeTypingText(text) {
  return String(text || "")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "");
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const MIN_PARAGRAPHS = 1;
const MAX_PARAGRAPHS = 5;

function normalizeParagraphs(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_PARAGRAPHS, Math.max(MIN_PARAGRAPHS, n));
}

function normalizeCategory(value) {
  const c = String(value || "all").toLowerCase();
  if (c === "sci" || c === "general") return "science";
  if (c === "phil" || c === "philippines" || c === "pinoy") return "ph";
  if (c === "animal") return "animals";
  return CATEGORY_IDS.includes(c) ? c : "all";
}

function getPassagePool(difficulty, language, category) {
  const d = normalizeDifficulty(difficulty);
  const lang = normalizeLanguage(language);
  const cat = normalizeCategory(category);
  if (cat === "all") {
    return PASSAGES[lang][d];
  }
  const pack = CATEGORY_PASSAGES[lang] && CATEGORY_PASSAGES[lang][cat];
  if (pack && pack[d] && pack[d].length) return pack[d];
  // fallback: any difficulty in that category, then all facts
  if (pack) {
    const merged = [...(pack.easy || []), ...(pack.normal || []), ...(pack.hard || [])];
    if (merged.length) return merged;
  }
  return PASSAGES[lang][d];
}

function pickPassage(difficulty, language, category) {
  return pickPassages(difficulty, language, 1, category);
}

/**
 * Pick N random paragraphs (unique when pool allows) and join for one race text.
 */
function pickPassages(difficulty, language, paragraphCount, category) {
  const count = normalizeParagraphs(paragraphCount);
  const pool = getPassagePool(difficulty, language, category);
  const parts = [];
  const used = new Set();

  for (let i = 0; i < count; i++) {
    if (used.size >= pool.length) {
      parts.push(randomFrom(pool));
      continue;
    }
    let idx = Math.floor(Math.random() * pool.length);
    let guard = 0;
    while (used.has(idx) && guard < 40) {
      idx = Math.floor(Math.random() * pool.length);
      guard++;
    }
    used.add(idx);
    parts.push(pool[idx]);
  }

  return normalizeTypingText(parts.join(" "));
}

/**
 * Timed mode: use selected paragraph count, but ensure enough text for 60s.
 * Minimum ~480 chars by adding extra paragraphs if needed.
 */
function pickTimedPassage(difficulty, language, paragraphCount, category) {
  const count = normalizeParagraphs(paragraphCount);
  let text = pickPassages(difficulty, language, count, category);
  const pool = getPassagePool(difficulty, language, category);
  const parts = [text];
  while (parts.join(" ").length < 480) {
    parts.push(randomFrom(pool));
  }
  return normalizeTypingText(parts.join(" "));
}

/**
 * Word mode: random words. Paragraphs 1–5 maps to ~25–125 words.
 */
function pickWords(difficulty, language, paragraphCount) {
  const d = normalizeDifficulty(difficulty);
  const lang = normalizeLanguage(language);
  const packs = normalizeParagraphs(paragraphCount);
  const wordCount = packs * 25;
  const pool = WORDS[lang][d];
  const out = [];
  for (let i = 0; i < wordCount; i++) {
    out.push(randomFrom(pool));
  }
  return normalizeTypingText(out.join(" "));
}

/** Unified race text picker for all modes. */
function pickRaceText(mode, difficulty, language, paragraphCount, category) {
  const m = normalizeMode(mode);
  if (m === "words") return pickWords(difficulty, language, paragraphCount);
  if (m === "timed") return pickTimedPassage(difficulty, language, paragraphCount, category);
  return pickPassages(difficulty, language, paragraphCount, category);
}

function listCategories() {
  return CATEGORY_IDS.map((id) => ({
    id,
    label: CATEGORIES[id].label,
    short: CATEGORIES[id].short,
  }));
}

function listDifficulties() {
  return DIFFICULTIES.map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
  }));
}

function listLanguages() {
  return LANGUAGES.map((id) => ({
    id,
    label: LANG_LABELS[id] || id,
  }));
}

function listModes() {
  return Object.values(MODES);
}

module.exports = {
  PASSAGES,
  CATEGORY_PASSAGES,
  WORDS,
  LANGUAGES,
  DIFFICULTIES,
  LANG_LABELS,
  CATEGORIES,
  CATEGORY_IDS,
  MODES,
  MIN_PARAGRAPHS,
  MAX_PARAGRAPHS,
  normalizeLanguage,
  normalizeDifficulty,
  normalizeMode,
  normalizeParagraphs,
  normalizeCategory,
  normalizeTypingText,
  pickPassage,
  pickPassages,
  pickTimedPassage,
  pickWords,
  pickRaceText,
  listDifficulties,
  listLanguages,
  listModes,
  listCategories,
};
