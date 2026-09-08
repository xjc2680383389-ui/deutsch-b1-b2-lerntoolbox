// 听力精听句库（36 句，B1 / B2 各 18 句；含中文、词汇点与语法解析）
export const SENTENCES = [
  {
    id: 'l01', level: 'B1',
    de: 'Können Sie mir bitte sagen, wie ich zum Bahnhof komme?',
    zh: '您能告诉我怎么去火车站吗？',
    points: [
      { w: 'Können Sie …?', zh: '礼貌请求句式，比 Können wir 更客气' },
      { w: 'wie', zh: '疑问副词，引导宾语从句' },
    ],
    grammar: 'wie 引导的宾语从句中，变位动词 komme 位于句末。',
  },
  {
    id: 'l02', level: 'B1',
    de: 'Der Zug nach München fährt heute von Gleis vier ab.',
    zh: '开往慕尼黑的火车今天从四号站台发车。',
    points: [
      { w: 'nach + 城市名', zh: '前往（城市、国家）' },
      { w: 'abfahren', zh: '可分动词，前缀 ab- 在句末' },
    ],
    grammar: '可分动词现在时：fährt … ab；von + 第三格 dem Gleis → vom Gleis。',
  },
  {
    id: 'l03', level: 'B1',
    de: 'Ich möchte ein Einzelzimmer für zwei Nächte reservieren.',
    zh: '我想预订一间单人间，住两晚。',
    points: [
      { w: 'möchte', zh: 'mögen 的虚拟式，表示委婉愿望' },
      { w: 'für + 第四格', zh: '表示一段时间' },
    ],
    grammar: '情态动词 möchte + 原形 reservieren，构成框型结构。',
  },
  {
    id: 'l04', level: 'B1',
    de: 'Haben Sie morgen Abend noch einen Tisch frei?',
    zh: '明天晚上还有空桌吗？',
    points: [
      { w: 'frei haben', zh: '有空（未被占用）' },
      { w: 'morgen Abend', zh: '时间状语，第四格/副词用法' },
    ],
    grammar: 'haben + 第四格宾语 + 形容词 frei 作补足语。',
  },
  {
    id: 'l05', level: 'B1',
    de: 'Die Sprechstunde dauert von neun bis zwölf Uhr.',
    zh: '门诊时间从九点持续到十二点。',
    points: [
      { w: 'von … bis …', zh: '从……到……（时间/空间）' },
      { w: 'dauern', zh: '持续（不及物）' },
    ],
    grammar: 'von … bis … 后接名词时不随格变化。',
  },
  {
    id: 'l06', level: 'B1',
    de: 'Ich habe seit gestern Halsschmerzen und Fieber.',
    zh: '我从昨天起嗓子疼并且发烧。',
    points: [
      { w: 'seit + 第三格', zh: '自从……（持续到现在）' },
      { w: 'Schmerzen haben', zh: '……疼（复数）' },
    ],
    grammar: 'seit 引导的时间状语要求动词用现在时。',
  },
  {
    id: 'l07', level: 'B1',
    de: 'Könnten Sie mir bitte erklären, wie das Medikament wirkt?',
    zh: '您能给我解释一下这种药的作用吗？',
    points: [
      { w: 'Könnten Sie', zh: 'konnte 的虚拟式 II，非常客气' },
      { w: 'wie', zh: '引导间接疑问句' },
    ],
    grammar: '情态动词虚拟式 II 表客气；从句动词 wirkt 句末。',
  },
  {
    id: 'l08', level: 'B1',
    de: 'Wir haben uns in der Altstadt verlaufen.',
    zh: '我们在老城区迷路了。',
    points: [
      { w: 'sich verlaufen', zh: '反身动词，迷路' },
      { w: 'in + 第三格', zh: '表示位置（wo）' },
    ],
    grammar: '反身动词完成时用 haben，反身代词位于句中。',
  },
  {
    id: 'l09', level: 'B1',
    de: 'Das Paket wurde gestern leider noch nicht geliefert.',
    zh: '包裹昨天可惜还没送到。',
    points: [
      { w: 'leider', zh: '可惜（句中副词）' },
      { w: 'noch nicht', zh: '还没有' },
    ],
    grammar: '过去时被动态：wurde + 第二分词 geliefert。',
  },
  {
    id: 'l10', level: 'B1',
    de: 'Für die Bewerbung brauchen Sie einen Lebenslauf und ein Zeugnis.',
    zh: '申请时您需要一份简历和一份证书。',
    points: [
      { w: 'für + 第四格', zh: '为了；用于' },
      { w: 'brauchen', zh: '需要（及物，第四格）' },
    ],
    grammar: 'brauchen 作实义动词时直接支配第四格宾语。',
  },
  {
    id: 'l11', level: 'B1',
    de: 'Ich bereite mich gerade auf die Prüfung vor.',
    zh: '我正在准备考试。',
    points: [
      { w: 'sich vorbereiten auf + 第四格', zh: '为……做准备' },
      { w: 'gerade', zh: '此刻、正在' },
    ],
    grammar: '可分动词 vorbereiten：bereitet … vor。',
  },
  {
    id: 'l12', level: 'B1',
    de: 'Der Kurs findet jeden Dienstag und Donnerstag statt.',
    zh: '这门课每周二和周四进行。',
    points: [
      { w: 'stattfinden', zh: '可分动词，举行' },
      { w: 'jeden Dienstag', zh: '每个周二（第四格表频率）' },
    ],
    grammar: 'stattfinden 现在时：findet … statt。',
  },
  {
    id: 'l13', level: 'B1',
    de: 'Er hat den Termin leider kurzfristig abgesagt.',
    zh: '他可惜临时取消了约会。',
    points: [
      { w: 'absagen', zh: '可分动词，取消' },
      { w: 'kurzfristig', zh: '临时的、短期的' },
    ],
    grammar: '可分动词第二分词：ab-ge-sagt。',
  },
  {
    id: 'l14', level: 'B1',
    de: 'Wir müssen die Rechnung bis Ende der Woche bezahlen.',
    zh: '我们必须在周末前付款。',
    points: [
      { w: 'bis + 第四格', zh: '直到……' },
      { w: 'die Rechnung bezahlen', zh: '付款、买单' },
    ],
    grammar: 'bis 后接时间名词常用第四格；Ende der Woche 为第二格定语。',
  },
  {
    id: 'l15', level: 'B1',
    de: 'Die Miete ist in den letzten Jahren stark gestiegen.',
    zh: '房租在过去几年里大幅上涨。',
    points: [
      { w: 'in den letzten Jahren', zh: '在过去几年里（第三格复数）' },
      { w: 'steigen', zh: '上升（用 sein 构成完成时）' },
    ],
    grammar: 'steigen 的完成时助动词用 sein：ist gestiegen。',
  },
  {
    id: 'l16', level: 'B1',
    de: 'Im Sommer fahren wir meistens an die Küste.',
    zh: '夏天我们大多去海边。',
    points: [
      { w: 'an + 第四格', zh: '表示方向（wohin）' },
      { w: 'meistens', zh: '通常、大多' },
    ],
    grammar: '静动介词 an：表方向用第四格 an die Küste。',
  },
  {
    id: 'l17', level: 'B1',
    de: 'Bitte schalten Sie das Licht aus, bevor Sie gehen.',
    zh: '请您走之前把灯关掉。',
    points: [
      { w: 'ausschalten', zh: '可分动词，关掉（电器）' },
      { w: 'bevor', zh: '在……之前（连词）' },
    ],
    grammar: 'bevor 引导时间从句，动词 gehen 位于句末。',
  },
  {
    id: 'l18', level: 'B1',
    de: 'Die Mülltrennung ist in diesem Haus Pflicht.',
    zh: '这栋楼里垃圾分类是强制的。',
    points: [
      { w: 'die Mülltrennung', zh: '垃圾分类' },
      { w: 'Pflicht sein', zh: '是义务、是强制的' },
    ],
    grammar: 'in + 第三格 diesem Haus 表位置。',
  },
  {
    id: 'l19', level: 'B2',
    de: 'Falls Sie Fragen haben, können Sie sich jederzeit an mich wenden.',
    zh: '如果您有问题，可以随时找我。',
    points: [
      { w: 'falls', zh: '万一、如果（连词）' },
      { w: 'sich wenden an + 第四格', zh: '向……求助' },
    ],
    grammar: 'falls 引导条件从句；主句可省略连词直接以反身代词开头。',
  },
  {
    id: 'l20', level: 'B2',
    de: 'Die Maßnahme wurde trotz heftiger Kritik umgesetzt.',
    zh: '尽管遭到激烈批评，这项措施还是被实施了。',
    points: [
      { w: 'trotz + 第二格', zh: '尽管（介词）' },
      { w: 'umsetzen', zh: '执行、落实' },
    ],
    grammar: 'trotz 要求第二格；主句为过去时被动态 wurde umgesetzt。',
  },
  {
    id: 'l21', level: 'B2',
    de: 'Ohne Ihre Unterstützung hätten wir das Projekt nicht abgeschlossen.',
    zh: '没有您的支持，我们无法完成这个项目。',
    points: [
      { w: 'ohne + 第四格', zh: '没有……' },
      { w: 'hätten … abgeschlossen', zh: '虚拟式 II 过去时' },
    ],
    grammar: 'ohne 短语替代非现实条件句，主句用 Konjunktiv II。',
  },
  {
    id: 'l22', level: 'B2',
    de: 'Es wird vermutet, dass die Ursache noch immer unbekannt ist.',
    zh: '据推测，原因仍然不明。',
    points: [
      { w: 'Es wird vermutet', zh: '无人称被动态，据推测' },
      { w: 'dass', zh: '引导主语从句' },
    ],
    grammar: '无人称被动态常用作客观性表达；dass 从句动词句末。',
  },
  {
    id: 'l23', level: 'B2',
    de: 'Die zu lösenden Probleme sind im Bericht zusammengefasst.',
    zh: '有待解决的问题都汇总在报告里。',
    points: [
      { w: 'zu lösenden', zh: 'zu + Partizip I，表示“需要被解决的”' },
      { w: 'zusammenfassen', zh: '总结、汇总' },
    ],
    grammar: '分词定语：zu lösend 按形容词变化，复数定冠词后加 -en。',
  },
  {
    id: 'l24', level: 'B2',
    de: 'Die Entscheidung beruht auf einer gründlichen Analyse der Daten.',
    zh: '这个决定基于对数据的深入分析。',
    points: [
      { w: 'beruhen auf + 第三格', zh: '基于……' },
      { w: 'gründlich', zh: '彻底的、深入的' },
    ],
    grammar: '名词 Analyse 保留介词搭配 auf；第二格 der Daten 作定语。',
  },
  {
    id: 'l25', level: 'B2',
    de: 'Infolge der Rezession ist die Arbeitslosigkeit deutlich gestiegen.',
    zh: '由于经济衰退，失业人数明显上升。',
    points: [
      { w: 'infolge + 第二格', zh: '由于（介词，书面语）' },
      { w: 'deutlich', zh: '明显地' },
    ],
    grammar: 'infolge 为第二格介词，语义相当于 wegen。',
  },
  {
    id: 'l26', level: 'B2',
    de: 'Der Antrag muss bis zum Monatsende eingereicht werden.',
    zh: '申请必须在月底前提交。',
    points: [
      { w: 'einreichen', zh: '提交（申请等）' },
      { w: 'bis zum', zh: 'bis zu + 第三格，直到……' },
    ],
    grammar: '情态动词被动态：muss + 第二分词 + werden。',
  },
  {
    id: 'l27', level: 'B2',
    de: 'Man nimmt an, dass die Nachfrage weiter zunehmen wird.',
    zh: '人们认为需求会继续增长。',
    points: [
      { w: 'annehmen', zh: '认为、假定' },
      { w: 'zunehmen', zh: '增加、增长' },
    ],
    grammar: 'man 作主语的主动句常用于替代被动态。',
  },
  {
    id: 'l28', level: 'B2',
    de: 'Die Teilnahme an der Fortbildung ist für alle Mitarbeiter verpflichtend.',
    zh: '参加进修对所有员工都是强制性的。',
    points: [
      { w: 'die Teilnahme an + 第三格', zh: '参加……' },
      { w: 'verpflichtend', zh: '有约束力的、强制的' },
    ],
    grammar: '名词化保留原动词的介词搭配（teilnehmen an → die Teilnahme an）。',
  },
  {
    id: 'l29', level: 'B2',
    de: 'Ungeachtet der Bedenken wurde der Vertrag unterzeichnet.',
    zh: '尽管存在顾虑，合同还是签署了。',
    points: [
      { w: 'ungeachtet + 第二格', zh: '不顾、尽管（介词）' },
      { w: 'unterzeichnen', zh: '签署' },
    ],
    grammar: '第二格介词置于句首作让步状语；主句为过去时被动态。',
  },
  {
    id: 'l30', level: 'B2',
    de: 'Sobald die Ergebnisse vorliegen, werden wir Sie informieren.',
    zh: '一有结果，我们就会通知您。',
    points: [
      { w: 'sobald', zh: '一……就……（连词）' },
      { w: 'vorliegen', zh: '（结果、文件）已具备、已到' },
    ],
    grammar: 'sobald 引导时间从句，主句用将来时 werden。',
  },
  {
    id: 'l31', level: 'B2',
    de: 'Die Lieferung verzögert sich infolge eines technischen Defekts.',
    zh: '由于技术故障，交货被延误了。',
    points: [
      { w: 'sich verzögern', zh: '（自己）被延误' },
      { w: 'der Defekt', zh: '故障、缺陷' },
    ],
    grammar: '反身动词 sich verzögern 具有被动含义。',
  },
  {
    id: 'l32', level: 'B2',
    de: 'Es ist zu prüfen, ob die Vorschriften eingehalten wurden.',
    zh: '需要检查这些规定是否得到了遵守。',
    points: [
      { w: 'sein + zu + 原形', zh: '表示“需要/必须被……”' },
      { w: 'einhalten', zh: '遵守（规定）' },
    ],
    grammar: '被动态替代形式 ist zu prüfen；ob 从句用完成时被动态。',
  },
  {
    id: 'l33', level: 'B2',
    de: 'Der Bericht lässt sich in drei Kernaussagen zusammenfassen.',
    zh: '报告可以归纳为三个核心论点。',
    points: [
      { w: 'sich lassen + 原形', zh: '可以被……' },
      { w: 'die Kernaussage', zh: '核心论点' },
    ],
    grammar: 'sich lassen 结构替代带 können 的被动态。',
  },
  {
    id: 'l34', level: 'B2',
    de: 'Sie soll bereits vor einem Jahr gekündigt haben.',
    zh: '据说她在一年前就已经辞职/解约了。',
    points: [
      { w: 'sollen + 第二分词 + haben', zh: '据说的过去事件（主观用法）' },
      { w: 'kündigen', zh: '解约、辞职' },
    ],
    grammar: '情态动词主观用法：sollen 表示传闻，不表示义务。',
  },
  {
    id: 'l35', level: 'B2',
    de: 'Die Verhandlung wurde unterbrochen, worüber alle überrascht waren.',
    zh: '谈判被中断了，对此所有人都感到惊讶。',
    points: [
      { w: 'unterbrechen', zh: '打断、中断' },
      { w: 'worüber', zh: '关系代词，指代前句内容' },
    ],
    grammar: 'worüber 引导接续关系从句，指代整个前句。',
  },
  {
    id: 'l36', level: 'B2',
    de: 'Angesichts der Kosten sollte man Alternativen in Erwägung ziehen.',
    zh: '鉴于费用，人们应该考虑替代方案。',
    points: [
      { w: 'angesichts + 第二格', zh: '鉴于、考虑到' },
      { w: 'in Erwägung ziehen', zh: '考虑（功能动词结构）' },
    ],
    grammar: '第二格介词 angesichts；sollte 为 sollen 的 Konjunktiv II，表建议。',
  },
];
