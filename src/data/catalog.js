export const categories = [
  { id: 'fruits-legumes', name: 'Fruits & Légumes', emoji: '🥬', color: '#22c55e' },
  { id: 'boucherie-poissons', name: 'Boucherie & Poissons', emoji: '🥩', color: '#ef4444' },
  { id: 'laitiers-oeufs', name: 'Produits laitiers & Œufs', emoji: '🥛', color: '#3b82f6' },
  { id: 'boulangerie', name: 'Boulangerie', emoji: '🥖', color: '#f59e0b' },
  { id: 'epicerie', name: 'Épicerie', emoji: '🫙', color: '#a855f7' },
  { id: 'boissons', name: 'Boissons', emoji: '🧃', color: '#06b6d4' },
  { id: 'surgeles', name: 'Surgelés', emoji: '❄️', color: '#0ea5e9' },
  { id: 'hygiene-beaute', name: 'Hygiène & Beauté', emoji: '🧴', color: '#ec4899' },
  { id: 'entretien', name: 'Entretien & Ménage', emoji: '🧽', color: '#14b8a6' },
  { id: 'bebe', name: 'Bébé', emoji: '👶', color: '#8b5cf6' },
  { id: 'snacks', name: 'Snacks & Biscuits', emoji: '🍪', color: '#f97316' }
]

const productGroups = {
  'fruits-legumes': [
    ['Tomates', 'مطيشة', 'kg', 8], ['Pommes de terre', 'بطاطا', 'kg', 7], ['Oignons', 'بصلة', 'kg', 6],
    ['Carottes', 'خيزو', 'kg', 8], ['Courgettes', 'كرعة خضرا', 'kg', 10], ['Aubergines', 'دنجال', 'kg', 9],
    ['Poivrons verts', 'فلفلة خضرا', 'kg', 12], ['Poivrons rouges', 'فلفلة حمرا', 'kg', 18], ['Concombres', 'خيار', 'kg', 9],
    ['Laitue', 'خس', 'pièce', 5], ['Persil', 'معدنوس', 'botte', 2], ['Coriandre', 'قزبور', 'botte', 2],
    ['Menthe', 'نعناع', 'botte', 2], ['Ail', 'ثومة', 'kg', 35], ['Citron', 'حامض', 'kg', 10],
    ['Oranges', 'ليمون', 'kg', 8], ['Bananes', 'بنان', 'kg', 14], ['Pommes', 'تفاح', 'kg', 16],
    ['Poires', 'بوعويد', 'kg', 18], ['Avocats', 'أفوكادو', 'kg', 35], ['Fraises', 'فريز', 'barquette', 18],
    ['Dattes', 'تمر', 'kg', 38], ['Haricots verts', 'لوبيا خضرا', 'kg', 16]
  ],
  'boucherie-poissons': [
    ['Poulet entier', 'دجاجة كاملة', 'kg', 36], ['Blanc de poulet', 'صدر الدجاج', 'kg', 68], ['Cuisses de poulet', 'فخاد الدجاج', 'kg', 45],
    ['Ailes de poulet', 'جناح الدجاج', 'kg', 38], ['Viande hachée bœuf', 'كفتة البقر', 'kg', 90], ['Bœuf à tajine', 'لحم الطاجين', 'kg', 95],
    ['Steak de bœuf', 'ستيك', 'kg', 115], ['Foie de bœuf', 'كبدة البقر', 'kg', 70], ['Agneau', 'لحم الغنم', 'kg', 105],
    ['Côtelettes d’agneau', 'ريش الغنم', 'kg', 125], ['Merguez', 'مركاز', 'kg', 82], ['Dinde hachée', 'كفتة الديك الرومي', 'kg', 65],
    ['Escalope de dinde', 'إسكالوب الديك الرومي', 'kg', 62], ['Sardines', 'سردين', 'kg', 18], ['Merlan', 'ميرلان', 'kg', 55],
    ['Dorade', 'شرغو', 'kg', 75], ['Saumon', 'سلمون', 'kg', 145], ['Crevettes', 'قمرون', 'kg', 95],
    ['Calamars', 'كلمار', 'kg', 90], ['Thon frais', 'تون طري', 'kg', 85], ['Filet de poisson blanc', 'فيليه الحوت', 'kg', 78],
    ['Boulettes de poisson', 'كويرات الحوت', 'pack', 32], ['Charcuterie de dinde', 'كاشير الديك الرومي', 'pack', 24]
  ],
  'laitiers-oeufs': [
    ['Lait entier', 'حليب كامل', 'L', 8], ['Lait demi-écrémé', 'حليب نصف دسم', 'L', 8], ['Lait sans lactose', 'حليب بلا لاكتوز', 'L', 15],
    ['Raïb', 'رايب', 'pot', 4], ['Lben', 'لبن', 'L', 9], ['Yaourt nature', 'ياغورت طبيعي', 'pack', 13],
    ['Yaourt vanille', 'ياغورت فاني', 'pack', 14], ['Yaourt fraise', 'ياغورت فريز', 'pack', 14], ['Fromage frais', 'جبن طري', 'pack', 18],
    ['Fromage fondu', 'فرماج مربع', 'pack', 22], ['Edam', 'فرماج إدام', 'kg', 95], ['Mozzarella', 'موزاريلا', 'pack', 25],
    ['Emmental râpé', 'فرماج محكوك', 'pack', 29], ['Cheddar tranches', 'شيدر شرائح', 'pack', 25], ['Beurre doux', 'زبدة', 'pack', 24],
    ['Beurre salé', 'زبدة مالحة', 'pack', 25], ['Crème fraîche', 'قشدة طرية', 'pot', 16], ['Crème cuisson', 'كريمة الطبخ', 'pack', 14],
    ['Œufs x6', 'بيض 6', 'pack', 10], ['Œufs x12', 'بيض 12', 'pack', 20], ['Œufs x30', 'بيض 30', 'plateau', 47],
    ['Jben beldi', 'جبن بلدي', 'pièce', 15], ['Dessert chocolat', 'ديسير شوكولا', 'pack', 17]
  ],
  boulangerie: [
    ['Pain rond', 'خبز مدور', 'pièce', 2], ['Baguette', 'باغيت', 'pièce', 2], ['Pain complet', 'خبز كامل', 'pièce', 5],
    ['Pain de mie nature', 'خبز التوست', 'pack', 16], ['Pain de mie complet', 'توست كامل', 'pack', 18], ['Batbout', 'بطبوط', 'pack', 10],
    ['Msemen', 'مسمن', 'pièce', 3], ['Harcha', 'حرشة', 'pièce', 3], ['Baghrir', 'بغرير', 'pack', 10],
    ['Croissant', 'كرواصة', 'pièce', 4], ['Pain au chocolat', 'بان شوكولا', 'pièce', 5], ['Brioche', 'بريوش', 'pack', 15],
    ['Galette burger', 'خبز برغر', 'pack', 15], ['Pain hot-dog', 'خبز هوت دوغ', 'pack', 14], ['Tortillas', 'تورتيلا', 'pack', 24],
    ['Pâte feuilletée', 'عجينة مورقة', 'pack', 18], ['Pâte à pizza', 'عجينة بيتزا', 'pack', 16], ['Chapelure', 'شابلور', 'g', 9],
    ['Mini pains', 'خبز صغير', 'pack', 12], ['Pain sans gluten', 'خبز بلا غلوتين', 'pack', 35], ['Madeleines', 'مادلين', 'pack', 16],
    ['Cake marbré', 'كيك مرمر', 'pièce', 25], ['Fekkas', 'فقاص', 'g', 22]
  ],
  epicerie: [
    ['Huile de tournesol', 'زيت المائدة', 'L', 18], ['Huile d’olive', 'زيت الزيتون', 'L', 65], ['Sucre granulé', 'سنيدة', 'kg', 9],
    ['Farine blanche', 'دقيق أبيض', 'kg', 7], ['Farine complète', 'دقيق كامل', 'kg', 11], ['Semoule fine', 'سميدة رقيقة', 'kg', 10],
    ['Couscous moyen', 'كسكس متوسط', 'kg', 14], ['Riz long', 'روز طويل', 'kg', 17], ['Riz basmati', 'روز بسمتي', 'kg', 30],
    ['Pâtes spaghetti', 'سباكيتي', 'pack', 9], ['Pâtes penne', 'معكرونة', 'pack', 9], ['Lentilles', 'عدس', 'kg', 22],
    ['Pois chiches', 'حمص', 'kg', 24], ['Haricots blancs', 'لوبيا بيضا', 'kg', 25], ['Thé vert', 'أتاي', 'pack', 24],
    ['Café moulu', 'قهوة مطحونة', 'pack', 30], ['Concentré de tomate', 'مطشة الحك', 'boîte', 7], ['Thon en conserve', 'تون مصبر', 'boîte', 14],
    ['Maïs en conserve', 'ذرة مصبرة', 'boîte', 12], ['Sel fin', 'ملحة', 'kg', 4], ['Poivre noir', 'إبزار', 'g', 10],
    ['Cumin', 'كمون', 'g', 9], ['Paprika', 'تحميرة', 'g', 9]
  ],
  boissons: [
    ['Eau minérale 1,5L', 'ماء معدني', 'bouteille', 5], ['Pack eau 6x1,5L', 'باك الماء', 'pack', 28], ['Eau gazeuse', 'ماء غازي', 'bouteille', 8],
    ['Jus d’orange', 'عصير البرتقال', 'L', 16], ['Jus multifruits', 'عصير مشكل', 'L', 17], ['Jus de pomme', 'عصير التفاح', 'L', 16],
    ['Nectar de mangue', 'عصير المانجا', 'L', 18], ['Soda cola 1L', 'كوكا', 'bouteille', 10], ['Soda citron 1L', 'ليموناد', 'bouteille', 10],
    ['Soda orange 1L', 'صودا البرتقال', 'bouteille', 10], ['Boisson énergétique', 'مشروب الطاقة', 'canette', 14], ['Thé glacé', 'أتاي بارد', 'bouteille', 12],
    ['Limonade artisanale', 'ليمونادة', 'bouteille', 15], ['Sirop de menthe', 'سيرو النعناع', 'bouteille', 22], ['Sirop de grenadine', 'سيرو الرمان', 'bouteille', 22],
    ['Eau de coco', 'ماء الكوك', 'bouteille', 20], ['Boisson amande', 'حليب اللوز', 'L', 28], ['Boisson avoine', 'حليب الشوفان', 'L', 29],
    ['Café soluble', 'قهوة سريعة', 'pot', 38], ['Chocolat en poudre', 'كاكاو بودرة', 'pack', 25], ['Infusion verveine', 'لويزة', 'pack', 20],
    ['Tisane camomille', 'بابونج', 'pack', 21], ['Lait aromatisé chocolat', 'حليب شوكولا', 'bouteille', 8]
  ],
  surgeles: [
    ['Petits pois surgelés', 'جلبانة مجمدة', 'pack', 18], ['Haricots verts surgelés', 'لوبيا خضرا مجمدة', 'pack', 19], ['Épinards surgelés', 'سبانخ مجمدة', 'pack', 17],
    ['Mélange de légumes', 'خضر مشكلة مجمدة', 'pack', 20], ['Frites surgelées', 'فريت مجمد', 'kg', 27], ['Pommes noisettes', 'بطاطا نوازيط', 'pack', 30],
    ['Pizza margherita', 'بيتزا فرماج', 'pièce', 32], ['Pizza poulet', 'بيتزا دجاج', 'pièce', 38], ['Nuggets de poulet', 'نيكيت الدجاج', 'pack', 36],
    ['Cordon bleu', 'كوردون بلو', 'pack', 42], ['Burger viande', 'برغر اللحم', 'pack', 39], ['Filets de poisson panés', 'فيليه حوت مبنن', 'pack', 37],
    ['Crevettes décortiquées', 'قمرون مقشر', 'pack', 65], ['Calamars en rondelles', 'كلمار دوائر', 'pack', 52], ['Pâte à croissant', 'عجينة كرواصة', 'pack', 28],
    ['Glace vanille', 'كلاص فاني', 'bac', 35], ['Glace chocolat', 'كلاص شوكولا', 'bac', 35], ['Glace fraise', 'كلاص فريز', 'bac', 35],
    ['Sorbet citron', 'سوربي الحامض', 'bac', 38], ['Glaçons', 'ثلج', 'sac', 10], ['Fruits rouges surgelés', 'فواكه حمراء مجمدة', 'pack', 45],
    ['Pastilla fruits de mer', 'بسطيلة الحوت', 'pièce', 55], ['Mini quiches', 'كيش صغير', 'pack', 34]
  ],
  'hygiene-beaute': [
    ['Shampooing', 'شامبوان', 'bouteille', 32], ['Après-shampooing', 'بلسم الشعر', 'bouteille', 34], ['Gel douche', 'جيل الدوش', 'bouteille', 28],
    ['Savon solide', 'صابون', 'pack', 12], ['Savon liquide mains', 'صابون اليدين', 'bouteille', 20], ['Dentifrice', 'معجون الأسنان', 'tube', 18],
    ['Brosses à dents', 'فرشاة الأسنان', 'pack', 22], ['Bain de bouche', 'غسول الفم', 'bouteille', 32], ['Déodorant femme', 'مزيل العرق نساء', 'pièce', 28],
    ['Déodorant homme', 'مزيل العرق رجال', 'pièce', 28], ['Coton-tiges', 'عود الأذن', 'boîte', 12], ['Cotons démaquillants', 'قطن الوجه', 'pack', 15],
    ['Crème hydratante', 'كريمة مرطبة', 'pot', 42], ['Crème solaire', 'واقي الشمس', 'tube', 85], ['Rasoirs jetables', 'شفرة الحلاقة', 'pack', 25],
    ['Mousse à raser', 'رغوة الحلاقة', 'bombe', 30], ['Serviettes hygiéniques', 'فوط صحية', 'pack', 24], ['Protège-slips', 'حماية يومية', 'pack', 22],
    ['Papier toilette', 'ورق الحمام', 'pack', 30], ['Mouchoirs', 'كلينيكس', 'boîte', 12], ['Lingettes', 'مناديل مبللة', 'pack', 18],
    ['Parfum léger', 'عطر خفيف', 'bouteille', 75], ['Baume à lèvres', 'مرطب الشفاه', 'pièce', 22]
  ],
  entretien: [
    ['Lessive liquide', 'صابون الماكينة', 'L', 55], ['Lessive poudre', 'غبرة التصبين', 'kg', 48], ['Adoucissant', 'ملين الملابس', 'L', 32],
    ['Liquide vaisselle', 'صابون الماعن', 'bouteille', 18], ['Pastilles lave-vaisselle', 'حبوب الماعن', 'pack', 75], ['Nettoyant sol', 'منظف الأرض', 'L', 22],
    ['Eau de javel', 'جافيل', 'L', 10], ['Nettoyant vitres', 'منظف الزاج', 'bouteille', 18], ['Dégraissant cuisine', 'مزيل الدهون', 'bouteille', 24],
    ['Nettoyant WC', 'منظف المرحاض', 'bouteille', 20], ['Éponges', 'فنيدات الماعن', 'pack', 12], ['Tampons à récurer', 'سلك الماعن', 'pack', 10],
    ['Chiffons microfibres', 'شيفون', 'pack', 20], ['Sacs poubelle petits', 'ميكة الزبل صغيرة', 'rouleau', 15], ['Sacs poubelle grands', 'ميكة الزبل كبيرة', 'rouleau', 22],
    ['Essuie-tout', 'ورق المطبخ', 'pack', 20], ['Papier aluminium', 'بابي ألومنيوم', 'rouleau', 18], ['Film alimentaire', 'بلاستيك الماكلة', 'rouleau', 16],
    ['Papier cuisson', 'ورق الفرن', 'rouleau', 20], ['Gants ménagers', 'قفازات التصبين', 'paire', 15], ['Désodorisant', 'معطر الدار', 'bombe', 24],
    ['Insecticide', 'مبيد الحشرات', 'bombe', 28], ['Allumettes', 'وقيد', 'boîte', 3]
  ],
  bebe: [
    ['Couches taille 1', 'ليكوش قياس 1', 'pack', 68], ['Couches taille 2', 'ليكوش قياس 2', 'pack', 72], ['Couches taille 3', 'ليكوش قياس 3', 'pack', 78],
    ['Couches taille 4', 'ليكوش قياس 4', 'pack', 82], ['Couches taille 5', 'ليكوش قياس 5', 'pack', 85], ['Lingettes bébé', 'مناديل البيبي', 'pack', 22],
    ['Lait 1er âge', 'حليب الرضع 1', 'boîte', 95], ['Lait 2e âge', 'حليب الرضع 2', 'boîte', 98], ['Céréales bébé', 'سيريلاك', 'boîte', 42],
    ['Petits pots légumes', 'ماكلة البيبي خضر', 'pot', 14], ['Compote bébé', 'كومبوط البيبي', 'pack', 24], ['Eau bébé', 'ماء البيبي', 'L', 8],
    ['Shampooing bébé', 'شامبوان البيبي', 'bouteille', 32], ['Gel lavant bébé', 'جيل البيبي', 'bouteille', 35], ['Savon bébé', 'صابون البيبي', 'pièce', 14],
    ['Crème change', 'كريمة الحفاظة', 'tube', 38], ['Huile bébé', 'زيت البيبي', 'bouteille', 30], ['Coton bébé', 'قطن البيبي', 'pack', 18],
    ['Biberon', 'رضاعة', 'pièce', 45], ['Tétines', 'مصاصة', 'pack', 35], ['Sacs à couches', 'أكياس الحفاظات', 'rouleau', 18],
    ['Lessive bébé', 'صابون حوايج البيبي', 'L', 55], ['Sérum physiologique', 'سيروم', 'boîte', 28]
  ],
  snacks: [
    ['Biscuits petit beurre', 'بسكوي', 'pack', 12], ['Biscuits chocolat', 'بسكوي شوكولا', 'pack', 15], ['Cookies', 'كوكيز', 'pack', 18],
    ['Gaufrettes vanille', 'كوفريط فاني', 'pack', 12], ['Gaufrettes chocolat', 'كوفريط شوكولا', 'pack', 12], ['Crackers salés', 'كراكر مالح', 'pack', 14],
    ['Chips nature', 'شيبس عادي', 'sachet', 10], ['Chips fromage', 'شيبس فرماج', 'sachet', 10], ['Chips paprika', 'شيبس تحميرة', 'sachet', 10],
    ['Pop-corn', 'بوب كورن', 'sachet', 9], ['Cacahuètes grillées', 'كاوكاو محمر', 'sachet', 12], ['Amandes', 'لوز', 'g', 32],
    ['Noix', 'كركاع', 'g', 38], ['Pistaches', 'بيستاش', 'g', 42], ['Raisins secs', 'زبيب', 'g', 20],
    ['Chocolat au lait', 'شوكولا بالحليب', 'tablette', 16], ['Chocolat noir', 'شوكولا كحلة', 'tablette', 20], ['Barres céréales', 'بار الحبوب', 'pack', 24],
    ['Bonbons', 'حلوة', 'sachet', 10], ['Chewing-gum', 'علكة', 'pack', 8], ['Pâte à tartiner', 'شوكولا الدهن', 'pot', 36],
    ['Confiture fraise', 'كونfiture فريز', 'pot', 24], ['Miel', 'عسل', 'pot', 45]
  ]
}

const emojiRules = [
  [/frites/, '🍟'], [/tomate/, '🍅'], [/pommes? de terre|pommes? noisettes/, '🥔'], [/oignon/, '🧅'],
  [/carotte/, '🥕'], [/courgette|concombre/, '🥒'], [/aubergine/, '🍆'], [/poivron|paprika/, '🫑'],
  [/laitue|épinard|persil|coriandre|menthe/, '🥬'], [/ail/, '🧄'], [/citron|limonade/, '🍋'],
  [/orange/, '🍊'], [/banane/, '🍌'], [/pommes?($|\s)|jus de pomme/, '🍎'], [/poire/, '🍐'],
  [/avocat/, '🥑'], [/fraise/, '🍓'], [/datte/, '🌴'], [/haricots? verts?|petits pois/, '🫛'],
  [/poulet|dinde|nuggets|cordon bleu/, '🍗'], [/steak|bœuf|agneau|viande hachée|merguez|côtelettes/, '🥩'],
  [/foie/, '🍖'], [/sardine|merlan|dorade|saumon|thon frais|poisson/, '🐟'], [/crevette/, '🍤'],
  [/calamar/, '🦑'], [/charcuterie/, '🍖'], [/lait |lait$|lben|raïb/, '🥛'], [/yaourt/, '🥣'],
  [/fromage|edam|mozzarella|emmental|cheddar|jben/, '🧀'], [/beurre/, '🧈'], [/crème/, '🥛'],
  [/œufs?/, '🥚'], [/dessert/, '🍮'], [/croissant/, '🥐'], [/pain rond|baguette/, '🥖'],
  [/pain de mie|pain complet|pain sans gluten|mini pains/, '🍞'], [/batbout|msemen|harcha|baghrir|tortilla/, '🫓'],
  [/pain au chocolat/, '🥐'], [/brioche|madeleine|cake|fekkas/, '🍰'], [/burger/, '🍔'], [/hot-dog/, '🌭'],
  [/pizza/, '🍕'], [/pâte feuilletée|pâte à croissant/, '🥐'], [/chapelure|farine|semoule/, '🌾'],
  [/huile/, '🫗'], [/sucre|sel fin/, '🧂'], [/couscous|riz/, '🍚'], [/pâtes|spaghetti|penne/, '🍝'],
  [/lentilles|pois chiches|haricots blancs/, '🫘'], [/thé|infusion|tisane/, '🍵'], [/café/, '☕'],
  [/concentré|conserve|maïs/, '🥫'], [/poivre|cumin/, '🌶️'], [/eau minérale|pack eau|eau gazeuse|eau bébé/, '💧'],
  [/jus|nectar/, '🧃'], [/soda|boisson énergétique|thé glacé/, '🥤'], [/sirop/, '🍹'], [/eau de coco/, '🥥'],
  [/boisson amande/, '🌰'], [/boisson avoine|céréales/, '🌾'], [/chocolat en poudre|lait aromatisé/, '🍫'],
  [/mélange de légumes/, '🥦'], [/glace|sorbet/, '🍨'], [/glaçons/, '🧊'], [/fruits rouges/, '🫐'],
  [/pastilla/, '🥧'], [/quiche/, '🥧'], [/shampooing|après-shampooing/, '🧴'], [/gel douche|gel lavant/, '🚿'],
  [/savon/, '🧼'], [/dentifrice|brosses à dents/, '🪥'], [/bain de bouche/, '🦷'], [/déodorant|parfum/, '🌸'],
  [/coton-tiges/, '👂'], [/coton|démaquillant/, '☁️'], [/crème hydratante|crème solaire|crème change/, '🧴'],
  [/rasoir|mousse à raser/, '🪒'], [/serviettes hygiéniques|protège-slips/, '🌷'], [/papier toilette/, '🧻'],
  [/mouchoirs/, '🤧'], [/lingettes/, '🧻'], [/baume à lèvres/, '💄'], [/lessive|adoucissant/, '👕'],
  [/liquide vaisselle|pastilles lave-vaisselle/, '🍽️'], [/nettoyant sol|eau de javel|nettoyant vitres|dégraissant|nettoyant wc/, '🧴'],
  [/éponges|tampons à récurer/, '🧽'], [/chiffons/, '🧹'], [/sacs poubelle/, '🗑️'], [/essuie-tout/, '🧻'],
  [/papier aluminium|film alimentaire|papier cuisson/, '📜'], [/gants ménagers/, '🧤'], [/désodorisant/, '🌺'],
  [/insecticide/, '🦟'], [/allumettes/, '🔥'], [/couches/, '🧷'], [/lait 1er âge|lait 2e âge/, '🍼'],
  [/petits pots|compote bébé/, '🥣'], [/huile bébé/, '🧴'], [/biberon/, '🍼'], [/tétines/, '👶'],
  [/biscuits|cookies|gaufrettes|crackers/, '🍪'], [/chips/, '🥔'], [/pop-corn/, '🍿'], [/cacahuètes/, '🥜'],
  [/amandes|noix|pistaches/, '🌰'], [/raisins secs/, '🍇'], [/chocolat/, '🍫'], [/bonbons/, '🍬'],
  [/chewing-gum/, '🫧'], [/pâte à tartiner/, '🍫'], [/confiture/, '🍓'], [/miel/, '🍯']
]

function productEmoji(name, fallback) {
  return emojiRules.find(([pattern]) => pattern.test(name.toLocaleLowerCase('fr')))?.[1] || fallback
}

// Curated Moroccan supermarket references. Prices are only starting estimates;
// T9dya learns the couple's real prices after each purchase.
const brandedRows = [
  ['laitiers-oeufs', 'Lait UHT entier', 'حليب كامل', 'Centrale', 'L', 10.5, '1 L'],
  ['laitiers-oeufs', 'Lait UHT demi-écrémé', 'حليب نصف دسم', 'Centrale', 'L', 10.5, '1 L'],
  ['laitiers-oeufs', 'Lait UHT entier', 'حليب كامل', 'Jaouda', 'L', 11, '1 L'],
  ['laitiers-oeufs', 'Lait sans lactose', 'حليب بلا لاكتوز', 'Jaouda', 'L', 12.5, '1 L'],
  ['laitiers-oeufs', 'Lait frais entier', 'حليب طري', 'Chergui', 'bouteille', 11, '900 ml'],
  ['laitiers-oeufs', 'Lait chocolaté Ghani', 'حليب شوكولا غني', 'Jaouda', 'bouteille', 4, '200 ml'],
  ['laitiers-oeufs', 'Lait fraise Ghani', 'حليب فريز غني', 'Jaouda', 'bouteille', 4, '200 ml'],
  ['laitiers-oeufs', 'Raïbi Jamila grenadine', 'رايبي جميلة رمان', 'Danone', 'pot', 2.5, '165 g'],
  ['laitiers-oeufs', 'Raïbi grenadine', 'رايبي رمان', 'Chergui', 'pack', 19.2, '8 × 165 g'],
  ['laitiers-oeufs', 'Raïbi Besty grenadine', 'رايبي بيستي', 'Jaouda', 'pot', 2.5, '165 g'],
  ['laitiers-oeufs', 'Yaourt Assil vanille', 'دانون أصيل فاني', 'Danone', 'pack', 19.9, '8 × 110 g'],
  ['laitiers-oeufs', 'Yaourt Velouté', 'ياغورت ڤلوتي', 'Danone', 'pack', 20, '8 × 110 g'],
  ['laitiers-oeufs', 'Yaourt Activia', 'ياغورت أكتيفيا', 'Danone', 'pack', 22, '8 × 110 g'],
  ['laitiers-oeufs', 'Yaourt à boire Dan’Up fraise', 'داناب فريز', 'Danone', 'pack', 32, '8 × 170 g'],
  ['laitiers-oeufs', 'Danette chocolat', 'دانيت شوكولا', 'Danone', 'pack', 18, '8 pots'],
  ['laitiers-oeufs', 'Yaourt Jnane nature', 'ياغورت جنان', 'Chergui', 'pack', 19.3, '8 × 110 g'],
  ['laitiers-oeufs', 'Yaourt Daya fraise', 'ياغورت دايا فريز', 'Chergui', 'bouteille', 6, '330 g'],
  ['laitiers-oeufs', 'Yaourt Grec fruits rouges', 'ياغورت يوناني', 'Jaouda', 'pack', 24, '8 × 110 g'],
  ['laitiers-oeufs', 'Fromage frais Perly', 'فرماج بيرلي', 'Jaouda', 'pack', 24, '8 × 85 g'],
  ['laitiers-oeufs', 'Fromage frais Gervais', 'فرماج جيرفي', 'Danone', 'pack', 28, '8 × 80 g'],
  ['laitiers-oeufs', 'Jben à tartiner', 'جبن للدهن', 'Chergui', 'pot', 15, '190 g'],
  ['laitiers-oeufs', 'Jebli fromage à tartiner', 'جبلي فرماج', 'Jebli', 'pot', 15, '190 g'],
  ['laitiers-oeufs', 'Fromage fondu 16 portions', 'فرماج مثلث', 'La Vache Qui Rit', 'boîte', 26, '16 portions'],
  ['laitiers-oeufs', 'Fromage fondu 16 portions', 'فرماج مثلث', 'Or Blanc', 'boîte', 20, '16 portions'],
  ['laitiers-oeufs', 'Fromage fondu', 'فرماج مثلث', 'Solis', 'boîte', 18, '16 portions'],
  ['laitiers-oeufs', 'Cheddar en plaquette', 'شيدر', 'Or Blanc', 'pack', 35, '235 g'],
  ['laitiers-oeufs', 'Edam en plaquette', 'إدام', 'Or Blanc', 'pack', 35, '235 g'],
  ['laitiers-oeufs', 'Gouda en plaquette', 'ݣودا', 'Or Blanc', 'pack', 34, '235 g'],
  ['laitiers-oeufs', 'Fromage rouge Edam', 'فرماج حمر', 'Or Blanc', 'pièce', 135, '850 g'],
  ['laitiers-oeufs', 'Cheddar râpé', 'شيدر محكوك', 'Le Berger', 'pack', 20, '150 g'],
  ['laitiers-oeufs', 'Mozzarella râpée', 'موزاريلا محكوكة', 'Le Berger', 'pack', 18, '150 g'],
  ['laitiers-oeufs', 'Fromage fondu', 'فرماج مثلث', "Land'Or", 'boîte', 41, '48 portions'],
  ['laitiers-oeufs', 'Kiri Jben à tartiner', 'كيري جبن', 'Kiri', 'pot', 15, '180 g'],
  ['laitiers-oeufs', 'Beurre doux', 'زبدة', 'Jaouda', 'pack', 19, '200 g'],
  ['laitiers-oeufs', 'Beurre doux', 'زبدة', 'Centrale', 'pack', 22, '200 g'],
  ['epicerie', 'Huile de table Lesieur Cristal', 'زيت المائدة', 'Lesieur Cristal', 'L', 19, '1 L'],
  ['epicerie', 'Huile de table Huilor', 'زيت المائدة', 'Huilor', 'L', 19, '1 L'],
  ['epicerie', 'Sucre granulé Enmer', 'سنيدة', 'Cosumar', 'kg', 9, '1 kg'],
  ['epicerie', 'Couscous moyen', 'كسكس متوسط', 'Dari', 'kg', 17, '1 kg'],
  ['epicerie', 'Couscous moyen', 'كسكس متوسط', 'Tria', 'kg', 16, '1 kg'],
  ['epicerie', 'Pâtes spaghetti', 'سباكيتي', 'Dari', 'pack', 10, '500 g'],
  ['epicerie', 'Farine fleur', 'دقيق فورص', 'MayMouna', 'kg', 8, '1 kg'],
  ['epicerie', 'Thé vert Sultan', 'أتاي سلطان', 'Sultan', 'pack', 28, '200 g'],
  ['epicerie', 'Thé vert Al Arche', 'أتاي العرش', 'Al Arche', 'pack', 25, '200 g'],
  ['epicerie', 'Confiture fraise', 'كونfiture فريز', 'Aïcha', 'pot', 23, '430 g'],
  ['epicerie', 'Concentré de tomate', 'مطيشة الحك', 'Aïcha', 'boîte', 8, '140 g'],
  ['epicerie', 'Mayonnaise', 'مايونيز', 'Lesieur', 'bouteille', 17, '235 g'],
  ['epicerie', 'Mayonnaise', 'مايونيز', 'Aïcha', 'bouteille', 19, '235 g'],
  ['epicerie', 'Ketchup', 'كاتشب', 'Star', 'bouteille', 17, '345 g'],
  ['boissons', 'Eau minérale', 'ماء معدني', 'Sidi Ali', 'bouteille', 5.5, '1,5 L'],
  ['boissons', 'Eau minérale', 'ماء معدني', 'Sidi Harazem', 'bouteille', 5, '1,5 L'],
  ['boissons', 'Eau de table', 'ماء المائدة', 'Aïn Saïss', 'bouteille', 5, '1,5 L'],
  ['boissons', 'Eau de table', 'ماء المائدة', 'Aquafina', 'bouteille', 4.5, '1,5 L'],
  ['boissons', 'Jus d’orange', 'عصير البرتقال', 'Valencia', 'L', 16, '1 L'],
  ['boissons', 'Jus multifruits', 'عصير مشكل', 'Marrakech', 'L', 17, '1 L'],
  ['boissons', 'Jus au lait Danao', 'عصير بالحليب', 'Danone', 'bouteille', 12, '900 ml'],
  ['boissons', 'Jus au lait Fawakih', 'عصير بالحليب', 'Chergui', 'bouteille', 13, '900 g'],
  ['snacks', 'Biscuits Tagger', 'بسكوي تاݣر', 'Bimo', 'pack', 8, 'format familial'],
  ['snacks', 'Biscuits Tonik', 'بسكوي طونيك', 'Bimo', 'pack', 8, 'format familial'],
  ['snacks', 'Biscuits Golden', 'بسكوي ݣولدن', 'Bimo', 'pack', 10, 'format familial'],
  ['snacks', 'Gaufrettes Genova', 'كوفريط جينوفا', 'Bimo', 'pack', 9, 'format familial'],
  ['snacks', 'Biscuits Henry’s', 'بسكوي هنريز', "Henry's", 'pack', 12, 'format familial'],
  ['snacks', 'Biscuits Abtal', 'بسكوي أبطال', 'Excelo', 'pack', 8, 'format familial'],
  ['snacks', 'Madeleines Merendina', 'ميرندينا', 'Bimo', 'pack', 15, 'pack'],
  ['snacks', 'Chips fromage', 'شيبس فرماج', 'Dénia', 'sachet', 10, '85 g'],
  ['snacks', 'Chips nature', 'شيبس عادي', 'Leader Chips', 'sachet', 10, '85 g'],
  ['entretien', 'Lessive poudre', 'غبرة التصبين', 'Ariel', 'kg', 55, '2 kg'],
  ['entretien', 'Lessive poudre', 'غبرة التصبين', 'Tide', 'kg', 50, '2 kg'],
  ['entretien', 'Lessive liquide', 'صابون الماكينة', 'Omo', 'L', 58, '2 L'],
  ['entretien', 'Liquide vaisselle', 'صابون الماعن', 'Fairy', 'bouteille', 22, '650 ml'],
  ['entretien', 'Liquide vaisselle', 'صابون الماعن', 'Magix', 'bouteille', 16, '650 ml'],
  ['hygiene-beaute', 'Dentifrice', 'معجون الأسنان', 'Colgate', 'tube', 22, '75 ml'],
  ['hygiene-beaute', 'Dentifrice', 'معجون الأسنان', 'Signal', 'tube', 20, '75 ml'],
  ['hygiene-beaute', 'Shampooing', 'شامبوان', 'Head & Shoulders', 'bouteille', 42, '400 ml'],
  ['hygiene-beaute', 'Shampooing', 'شامبوان', 'Pantene', 'bouteille', 38, '400 ml'],
  ['hygiene-beaute', 'Gel douche', 'جيل الدوش', 'Dove', 'bouteille', 35, '500 ml'],
  ['hygiene-beaute', 'Déodorant', 'مزيل العرق', 'Nivea', 'pièce', 30, '50 ml']
]

const brandedProducts = brandedRows.map(([category, name, altName, brand, unit, defaultPrice, format, emoji], index) => {
  const categoryInfo = categories.find((item) => item.id === category)
  return {
    id: `brand-${String(index + 1).padStart(3, '0')}`,
    name,
    altName,
    brand,
    format,
    category,
    categoryName: categoryInfo.name,
    emoji: emoji || productEmoji(name, categoryInfo.emoji),
    unit,
    defaultPrice
  }
})

const genericProducts = categories.flatMap((category) =>
  productGroups[category.id].map(([name, altName, unit, defaultPrice], index) => ({
    id: `${category.id}-${String(index + 1).padStart(2, '0')}`,
    name,
    altName,
    category: category.id,
    categoryName: category.name,
    emoji: productEmoji(name, category.emoji),
    unit,
    defaultPrice
  }))
)

export const catalog = [...brandedProducts, ...genericProducts]

export const brands = [...new Set(brandedProducts.map((product) => product.brand))].sort((a, b) => a.localeCompare(b, 'fr'))

export const catalogById = Object.fromEntries(catalog.map((product) => [product.id, product]))
