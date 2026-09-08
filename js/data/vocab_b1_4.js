// B1 词库 第 4 段（健康、身体与饮食）
export const LEVEL = 'B1';
export const DECK_ID = 'b1';
export const RAW = `
Gesundheit|名词·阴性（复 -）|健康|Gesundheit ist das Wichtigste.|健康是最重要的。
Krankheit|名词·阴性（复 -en）|疾病|Die Krankheit ist heilbar.|这种病可以治愈。
Schmerz|名词·阳性（复 -en）|疼痛|Ich habe Schmerzen im Rücken.|我背疼。
Erkältung|名词·阴性（复 -en）|感冒|Ich habe eine Erkältung.|我感冒了。
Fieber|名词·中性（复 -）|发烧|Das Kind hat Fieber.|孩子发烧了。
Husten|名词·阳性（复 -）|咳嗽|Der Husten ist schlimmer geworden.|咳嗽加重了。
Schnupfen|名词·阳性（复 -）|流鼻涕；鼻炎|Ich habe Schnupfen und Husten.|我流鼻涕又咳嗽。
Untersuchung|名词·阴性（复 -en）|检查|Die Untersuchung dauert zehn Minuten.|检查需要十分钟。
Behandlung|名词·阴性（复 -en）|治疗|Die Behandlung war erfolgreich.|治疗很成功。
Rezept|名词·中性（复 -e）|处方|Der Arzt schreibt ein Rezept.|医生开了一张处方。
Versicherung|名词·阴性（复 -en）|保险|Die Versicherung zahlt die Kosten.|保险公司支付这笔费用。
Patient|名词·阳性（复 -en）|病人|Der Patient wartet im Zimmer.|病人在房间里等候。
operieren|动词·及物/不及物|动手术|Man muss ihn sofort operieren.|必须马上给他动手术。
heilen|动词·及物/不及物|治愈|Die Wunde heilt langsam.|伤口愈合得很慢。
sich erholen|动词·反身（不可分）|休养；恢复|Er hat sich gut erholt.|他恢复得很好。
Schlaf|名词·阳性（复 -）|睡眠|Ich brauche mehr Schlaf.|我需要更多睡眠。
Ernährung|名词·阴性（复 -en）|饮食；营养|Auf die Ernährung sollte man achten.|应该注意饮食。
Gewicht|名词·中性（复 -e）|体重|Mein Gewicht ist gleich geblieben.|我的体重没变。
abnehmen|动词·不及物（可分）|减肥；减少|Ich möchte fünf Kilo abnehmen.|我想减五公斤。
zunehmen|动词·不及物（可分）|增重；增加|Ich habe zwei Kilo zugenommen.|我胖了两公斤。
Bewegung|名词·阴性（复 -en）|运动；活动|Bewegung ist gesund.|运动有益健康。
Stress|名词·阳性（复 -e）|压力|Der Stress macht mich krank.|压力让我生病。
sich entspannen|动词·反身（不可分）|放松|Ich entspanne mich beim Lesen.|我通过阅读放松。
Entspannung|名词·阴性（复 -en）|放松|Ich brauche mehr Entspannung.|我需要更多放松。
Medikament|名词·中性（复 -e）|药物|Das Medikament hilft schnell.|这药见效快。
Tablette|名词·阴性（复 -n）|药片|Nimm drei Tabletten am Tag.|一天吃三片药。
Salbe|名词·阴性（复 -n）|药膏|Die Salbe hilft gegen Jucken.|这药膏能止痒。
Verband|名词·阳性（复 Verbände）|绷带|Der Arzt macht einen Verband.|医生包扎了绷带。
sich verletzen|动词·反身（不可分）|受伤|Er hat sich am Knie verletzt.|他膝盖受伤了。
Verletzung|名词·阴性（复 -en）|受伤|Die Verletzung ist nicht schlimm.|伤势不重。
bluten|动词·不及物|流血|Die Wunde blutet stark.|伤口流血很多。
Unfall|名词·阳性（复 Unfälle）|事故|Es gab einen Unfall auf der Autobahn.|高速公路上发生了一起事故。
Erste Hilfe|名词·阴性（复 -）|急救|Er hat Erste Hilfe geleistet.|他做了急救。
Krankenwagen|名词·阳性（复 -）|救护车|Der Krankenwagen ist schon da.|救护车已经到了。
Praxis|名词·阴性（复 Praxen）|诊所|Die Praxis ist am Marktplatz.|诊所在集市广场。
Hausarzt|名词·阳性（复 Hausärzte）|家庭医生|Mein Hausarzt kennt mich lange.|我的家庭医生认识我很久了。
Facharzt|名词·阳性（复 Fachärzte）|专科医生|Der Facharzt hat mehr Erfahrung.|专科医生经验更丰富。
Krankenkasse|名词·阴性（复 -n）|医疗保险公司|Die Krankenkasse übernimmt die Kosten.|医保公司承担费用。
Durchfall|名词·阳性（复 Durchfälle）|腹泻|Er hat seit gestern Durchfall.|他从昨天起拉肚子。
Übelkeit|名词·阴性（复 -en）|恶心|Ich fühle Übelkeit.|我觉得恶心。
schwindelig|形容词|头晕的|Mir ist schwindelig.|我头晕。
erschöpft|形容词|精疲力竭的|Nach der Arbeit bin ich erschöpft.|下班后我精疲力竭。
Kreislauf|名词·阳性（复 Kreisläufe）|血液循环|Mein Kreislauf ist heute schwach.|我今天血液循环不太好。
Immunsystem|名词·中性（复 -e）|免疫系统|Das Immunsystem schützt den Körper.|免疫系统保护身体。
Ansteckung|名词·阴性（复 -en）|传染|Die Ansteckung erfolgt durch Tröpfchen.|传染通过飞沫发生。
sich anstecken|动词·反身（可分）|被传染|Ich habe mich bei ihm angesteckt.|我被他传染了。
Heilung|名词·阴性（复 -en）|痊愈|Die Heilung dauert lange.|痊愈需要很长时间。
Symptom|名词·中性（复 -e）|症状|Welche Symptome hast du?|你有什么症状？
Diagnose|名词·阴性（复 -n）|诊断|Die Diagnose war klar.|诊断很明确。
Blutdruck|名词·阳性（复 -）|血压|Mein Blutdruck ist zu hoch.|我的血压太高了。
Vitamin|名词·中性（复 -e）|维生素|Obst enthält viele Vitamine.|水果富含维生素。
Kalorie|名词·阴性（复 -n）|卡路里|Diese Mahlzeit hat viele Kalorien.|这餐热量很高。
Zutat|名词·阴性（复 -en）|食材；配料|Die Zutaten stehen auf der Packung.|配料写在包装上。
Mahlzeit|名词·阴性（复 -en）|一餐|Drei Mahlzeiten am Tag sind gut.|一天三餐很好。
Gericht|名词·中性（复 -e）|菜；菜肴|Das Gericht schmeckt ausgezeichnet.|这道菜非常好吃。
schmecken|动词·不及物|尝起来……|Das schmeckt nach Knoblauch.|这尝起来有大蒜味。
Geschmack|名词·阳性（复 Geschmäcke）|味道；品味|Über Geschmack kann man streiten.|口味可以争论。
salzig|形容词|咸的|Die Suppe ist zu salzig.|汤太咸了。
scharf|形容词|辣的；锋利的|Das Essen ist mir zu scharf.|这菜对我来说太辣了。
braten|动词·及物|煎；烤|Ich brate das Fleisch in der Pfanne.|我在锅里煎肉。
zubereiten|动词·及物（可分）|烹调；准备|Sie bereitet das Essen zu.|她在做饭。
Speisekarte|名词·阴性（复 -n）|菜单|Die Speisekarte ist auf Deutsch.|菜单是德语的。
Rechnung|名词·阴性（复 -en）|账单|Die Rechnung bitte!|请买单！
Trinkgeld|名词·中性（复 -er）|小费|Wir geben zehn Prozent Trinkgeld.|我们给百分之十的小费。
satt|形容词|饱的|Ich bin satt.|我饱了。
Diät|名词·阴性（复 -en）|（治疗性）节食|Der Arzt empfiehlt eine Diät.|医生建议节食。
vegetarisch|形容词|素食的|Ich esse vegetarisch.|我吃素。
Portion|名词·阴性（复 -en）|一份|Eine Portion Pommes, bitte.|请来一份薯条。
Nachtisch|名词·阳性（复 -e）|甜点|Als Nachtisch gibt es Eis.|甜点是冰淇淋。
Lebensmittel|名词·中性（复 -）|食品|Die Lebensmittel sind frisch.|这些食品很新鲜。
`;
