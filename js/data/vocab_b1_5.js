// B1 词库 第 5 段（日常生活、住房与购物）
export const LEVEL = 'B1';
export const DECK_ID = 'b1';
export const RAW = `
Haushalt|名词·阳性（复 -e）|家务；家庭|Wir teilen den Haushalt.|我们分担家务。
spülen|动词·及物/不及物|洗碗；冲洗|Ich spüle das Geschirr.|我在洗碗。
Wäsche|名词·阴性（复 -n）|待洗衣物|Die Wäsche hängt im Garten.|洗好的衣物晾在花园里。
Waschmaschine|名词·阴性（复 -n）|洗衣机|Die Waschmaschine ist kaputt.|洗衣机坏了。
Einkauf|名词·阳性（复 Einkäufe）|采购；买的东西|Der Einkauf dauert lange.|这次采购花了很久。
Kasse|名词·阴性（复 -n）|收银台|Bitte zahlen Sie an der Kasse.|请在收银台付款。
bar|副词/形容词|现金的|Ich zahle bar.|我付现金。
Kreditkarte|名词·阴性（复 -n）|信用卡|Kann ich mit Kreditkarte zahlen?|我可以用信用卡付款吗？
Konto|名词·中性（复 Konten）|账户|Ich habe ein Konto bei dieser Bank.|我在这家银行有个账户。
Überweisung|名词·阴性（复 -en）|转账|Die Überweisung ist noch nicht da.|这笔转账还没到账。
Quittung|名词·阴性（复 -en）|收据|Ich brauche eine Quittung.|我需要一张收据。
Rabatt|名词·阳性（复 -e）|折扣|Wir bekommen zehn Prozent Rabatt.|我们得到九折优惠。
preiswert|形容词|物美价廉的|Das Restaurant ist preiswert.|这家餐馆物美价廉。
sparen|动词·及物/不及物|储蓄；节省|Ich spare für ein Auto.|我在攒钱买车。
ausgeben|动词·及物（可分）|支出；花费|Sie gibt viel Geld für Kleidung aus.|她在服装上花很多钱。
Tüte|名词·阴性（复 -n）|袋子|Ich nehme eine Tüte.|我拿一个袋子。
Größe|名词·阴性（复 -n）|尺码；大小|Welche Größe brauchen Sie?|您需要什么尺码？
passen|动词·不及物|合身；合适|Die Hose passt mir nicht.|这条裤子不合身。
umtauschen|动词·及物（可分）|退换|Kann ich das umtauschen?|我可以退换这个吗？
Reklamation|名词·阴性（复 -en）|（质量）投诉|Die Reklamation wurde angenommen.|投诉被受理了。
Miete|名词·阴性（复 -n）|租金|Die Miete ist jeden Monat fällig.|租金每月到期。
vermieten|动词·及物（不可分）|出租|Sie vermietet eine Wohnung.|她出租一套住房。
Vermieter|名词·阳性（复 -）|房东|Der Vermieter kommt morgen.|房东明天来。
Mieter|名词·阳性（复 -）|房客|Die Mieter sind sehr ruhig.|房客们很安静。
Nebenkosten|名词·复数|附加费用|Die Nebenkosten sind hoch.|附加费用很高。
Kaution|名词·阴性（复 -en）|押金|Die Kaution beträgt drei Monatsmieten.|押金相当于三个月租金。
Umzug|名词·阳性（复 Umzüge）|搬家|Der Umzug ist am Samstag.|搬家在周六。
umziehen|动词·不及物（可分）|搬家；换衣服|Wir ziehen nächste Woche um.|我们下周搬家。
einrichten|动词·及物（可分）|布置；安排|Wir richten die Wohnung neu ein.|我们重新布置住房。
Einrichtung|名词·阴性（复 -en）|布置；家具|Die Einrichtung ist modern.|这套家具很现代。
Möbel|名词·中性（复 -）|家具|Die Möbel sind aus Holz.|这些家具是木质的。
renovieren|动词·及物|翻新；装修|Wir renovieren das Bad.|我们在翻新浴室。
Heizung|名词·阴性（复 -en）|暖气|Die Heizung ist kaputt.|暖气坏了。
Keller|名词·阳性（复 -）|地下室|Die Fahrräder stehen im Keller.|自行车放在地下室。
Dachboden|名词·阳性（复 Dachböden）|阁楼|Alte Kisten stehen auf dem Dachboden.|旧箱子放在阁楼上。
Balkon|名词·阳性（复 -e/-s）|阳台|Wir frühstücken auf dem Balkon.|我们在阳台上吃早餐。
Garage|名词·阴性（复 -n）|车库|Das Auto steht in der Garage.|车停在车库里。
Nachbar|名词·阳性（复 -n）|邻居|Mein Nachbar hilft mir oft.|我的邻居常帮我。
Nachbarschaft|名词·阴性（复 -en）|邻里；周边|Die Nachbarschaft ist freundlich.|这一带邻里很友善。
gemütlich|形容词|舒适惬意的|Die Wohnung ist sehr gemütlich.|这套房子很温馨。
Stockwerk|名词·中性（复 -e）|楼层|Wir wohnen im dritten Stockwerk.|我们住在四楼。
Aufzug|名词·阳性（复 Aufzüge）|电梯|Der Aufzug funktioniert nicht.|电梯坏了。
Hausmeister|名词·阳性（复 -）|房屋管理员|Der Hausmeister repariert das Licht.|管理员在修灯。
Müll|名词·阳性（复 -）|垃圾|Bitte bring den Müll raus.|请把垃圾拿出去。
Mülltrennung|名词·阴性（复 -en）|垃圾分类|Mülltrennung ist hier Pflicht.|这里垃圾分类是强制的。
Reparatur|名词·阴性（复 -en）|修理|Die Reparatur kostet achtzig Euro.|修理费八十欧元。
reparieren|动词·及物|修理|Kannst du das Fahrrad reparieren?|你会修自行车吗？
Handwerker|名词·阳性（复 -）|工匠；技工|Der Handwerker kommt am Montag.|技工周一来。
Eigentumswohnung|名词·阴性（复 -en）|私有住宅|Sie hat eine Eigentumswohnung gekauft.|她买了一套自有住房。
Strom|名词·阳性（复 -）|电|Der Strom ist heute teuer.|现在电费很贵。
Verbrauch|名词·阳性（复 -）|消耗量|Der Verbrauch ist gesunken.|消耗量下降了。
Zähler|名词·阳性（复 -）|计量表|Der Zähler wird einmal im Jahr abgelesen.|计量表每年抄一次。
Glühbirne|名词·阴性（复 -n）|灯泡|Die Glühbirne ist durchgebrannt.|灯泡烧坏了。
Ersatzschlüssel|名词·阳性（复 -）|备用钥匙|Hast du einen Ersatzschlüssel?|你有备用钥匙吗？
Schloss|名词·中性（复 Schlösser）|锁；宫殿|Das Schloss ist kaputt.|这把锁坏了。
Terrasse|名词·阴性（复 -n）|露台|Wir sitzen auf der Terrasse.|我们坐在露台上。
Flur|名词·阳性（复 -e）|走廊|Das Bild hängt im Flur.|画挂在走廊里。
Haustür|名词·阴性（复 -en）|住宅大门|Die Haustür ist abgeschlossen.|大门锁上了。
Sicherheit|名词·阴性（复 -en）|安全|Die Sicherheit ist wichtig.|安全很重要。
Einbruch|名词·阳性（复 Einbrüche）|入室盗窃|Es gab einen Einbruch im Haus.|这栋楼发生了一起入室盗窃。
Vertrag|名词·阳性（复 Verträge）|合同|Der Vertrag läuft zwei Jahre.|合同有效期两年。
abschließen|动词·及物（可分）|签订；锁上|Wir haben den Vertrag abgeschlossen.|我们签订了合同。
Mietvertrag|名词·阳性（复 Mietverträge）|租房合同|Im Mietvertrag steht alles.|租房合同里都写着。
Mieterhöhung|名词·阴性（复 -en）|涨租|Die Mieterhöhung ist zu hoch.|这次涨租太高了。
Ausstattung|名词·阴性（复 -en）|配备；设施|Die Ausstattung ist sehr gut.|设施非常好。
Einfamilienhaus|名词·中性（复 Einfamilienhäuser）|独栋住宅|Sie wohnen in einem Einfamilienhaus.|他们住在一栋独栋住宅里。
Wohngemeinschaft|名词·阴性（复 -en）|合租公寓|Ich lebe in einer Wohngemeinschaft.|我住在合租公寓里。
Mietwohnung|名词·阴性（复 -en）|出租房|Die Mietwohnung ist hell.|这套出租房很亮堂。
Erdgeschoss|名词·中性（复 -e）|一楼（底层）|Die Praxis ist im Erdgeschoss.|诊所在一楼。
Etage|名词·阴性（复 -n）|楼层|In welcher Etage wohnst du?|你住在哪一层？
`;
