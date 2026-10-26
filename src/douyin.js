// Skills and prompts collected from the eight Douyin works supplied by the user.
// Every entry keeps a link to the creator's original post for attribution.

const POST = {
  travel: "https://v.douyin.com/kJMooKTeG6A/",
  twenty: "https://v.douyin.com/rSfO3FIvUdc/",
  zine: "https://v.douyin.com/bMOpW162ons/",
  museum: "https://v.douyin.com/X3DcteAGvx0/",
  diary: "https://v.douyin.com/VUtCWLyaZms/",
  prompts: "https://v.douyin.com/zm414MxDi14/",
  light: "https://v.douyin.com/GY5ppQYBz0w/",
  knit: "https://v.douyin.com/Vg1U2MRGZ-A/",
};

const GZ = "https://github.com/GZ-L/photo-to-poster-skills/tree/main/skills";

const GATHERED_PROMPT = `【核心处理指令 / Gathered Scenes Zine v1.3】

1. 边缘过渡（顺应物势的撕纸成界 - 核心重构）：
彻底摒弃固定的几何裁剪或死板的上下边缘。在摄影图像与纸张画布的交接处，必须生成清晰可见的、手工撕纸形态的纤维边缘。撕裂的位置和形态必须由原图的视觉元素决定，灵活采用以下三种逻辑之一：
- 轮廓顺应（Contour Following）：沿着核心主体（如树木枝干、建筑边缘）的自然轮廓进行撕裂，剥离原始背景（如天空），让主体如同从纸面中生长出来。
- 空间分割（Dynamic Division）：顺应画面原有的透视线或对角线（如河流走向、街道边缘）进行大面积的不规则对角/侧边撕裂，形成强烈的平面空间对峙。
- 焦点开窗（Focal Framing）：围绕画面的核心视觉焦点（如一盏灯笼、一扇窗户），在纸张中央撕开一个不规则的孔洞，透过撕口露出真实的摄影局部，隐藏周边杂乱信息。
- 质感要求：边缘需表现出不规则的锯齿、裸露的纸张纤维须边、局部磨损以及露出的温暖纸张底色。严禁使用干净的数字蒙版或发光/投影等 3D 效果。

2. 场景保留与抽象（真景为锚、插画成场）：
保留撕裂区域内真实的核心主体和摄影质感。而在撕裂边缘之外的大面积纸张留白处，采用中度抽象，向外延展插画场域。大幅压缩复杂的自然细节，将其转化为简化的平面视觉语言（如树冠化为大块的粗糙墨迹、建筑化为简化的干枯笔触线条、水波纹化为抽象的流动线）。插画部分应占据约 60%–75% 的画面空间，让大面积的纸张“留白”成为主动的设计元素。

3. 色彩与元素的跨界结构（打破边界）：
除中性墨色外，仅添加一种高饱和度的印刷色彩（如朱红、高纯度亮橙、钴蓝等）作为构图骨架。该色彩或插画元素必须跨越撕纸边界，实现真实与虚拟的连接。例如：真实灯笼的红色流苏在纸面上延伸为手绘红色线条；真实河流的动势在纸面上延伸为橙色抽象水波；真实树木的枝干在纸面上延伸为墨色拓印。色彩不是孤立装饰，而是用于引导视线和平衡构图。

4. 文本与物理质感（纸面会呼吸）：
使用暖色调的米白做旧艺术纸作为画布底层，带有细腻纤维、克制的斑点、轻微的扫描噪点以及平面的印刷油墨吸附感。保持纯二维平面效果。在安静的留白区域边缘或角落，添加一处极小的微型文本。文本使用复古打字机字体，字数极简（如 "Endure", "Lantern", "Work / Water / Stillness"），完美融入纸张纹理中，不可使用光洁的现代数字显示字体。

5. 整体气质：材料纤维感，以及手工拼贴/印刷的不完美质感。

补充判断与制作提示（来自另一条实操演示）：
- 先判断照片的叙事焦点，再根据焦点设计撕口，不预设照片必须占 35% 或 50%。
- 允许只保留人物、局部水面或建筑群。
- 撕口沿海岸、水线、树冠或建筑结构发展，与原始画面共同营造空间和层次的穿越感。
- 摄影区域之外的插画必须来自同一个场景。
- 撕口附近先保留原照片色彩，再逐渐转成网点、干刷或丝网印刷。
- 用一条连续色彩或运动轨迹跨越摄影和插画。
- 明确禁止矩形贴图、均匀白边和数码蒙版感。`;

const INK_DIPTYCH_PROMPT = `一张采用竖向二分构图的哑光米白画册明信片。

上半区（实景）：严格保留高清写实摄影风景原貌。完全沿用原始景物的空间布局、物理轮廓及原生低饱和度配色，零改动，维持原生光影质感。

下半区（水墨重构）：独立的米色留白区域，置入水墨扁平重构插画。提取上半部分全部景物，将其解构为极简几何形态。运用分层平涂的柔和色块，结合毛笔淡墨的晕染笔触，彻底摒弃锐利硬边。严格复刻原图整体色彩调性，但完全剔除所有细碎纹理、冗余杂物及复杂光影，仅保留纯粹的结构神韵。

排版文字：画面最底端，底部居中排版。首行为优雅的衬线手写体英文标题，次行为字号更小的无衬印英文描述短句。

整体质感：基于米白哑光特种纸底色，贯彻大面积留白理念。遵循极简主义东方建筑风景研究的版式逻辑，呈现出干净、克制、高级且具有学术感的视觉效果，无任何多余装饰元素。`;

const SURREAL_PROMPT = `超现实主义：@ice cream: surreal pop collage, vertical 3:4,
keep the 【主体】 clearly recognizable, keep its original colors intact, 【可选细节约束：例如 hands empty, no props】,
the background replaced by huge flat matte color shapes: 【2-3个平涂色形+颜色，例：flat matte dark emerald irregular blocks, flat matte warm brown irregular blocks】,
one impossible giant element: 【唯一巨物，必须源自原图】,
【小元素群】 in graduated sizes following an arc,
a few white hand-drawn graffiti strokes,
flat matte colors, no gradients, no shadows, no text, no watermark`;

const LIGHT_ART_PROMPT = `【真实摄影 × 参数化流光线条艺术｜通用生成提示词】

请以上传的真实照片为唯一具象内容来源，将照片重新设计为一张具有高级艺术杂志质感的“真实摄影 × 参数化流光线条艺术”双重现实海报。整体风格融合 Generative Art（生成艺术）、Parametric Line Art（参数化线条艺术）、Flowing Light Sculpture（流动光线雕塑）、Luminous Contour Art（发光轮廓艺术）、Dreamlike Light Trails（梦幻光轨）与 Minimal Editorial Design（极简编辑设计）。作品应呈现真实世界与梦幻数字世界相互呼应的视觉关系，兼具精密线条结构、柔和光晕、梦境氛围、空间纵深和当代艺术感。

【一、画面尺寸与版式】
整体采用 3:4 竖版构图，高清独立海报，不制作多图拼贴、合集或网格。画面上下严格按照 1:1 分区，上半部分占画面高度 50%，下半部分占 50%，两部分之间使用干净、平直的水平分界线，不使用装饰边框或圆角。上半部分为真实摄影，下半部分为同一照片的参数化流光艺术重构。上下两部分必须在主体数量、位置、基本轮廓、空间关系和视觉重心上形成对应，呈现同一场景的两种视觉现实。上半部分和下半部分均须完整填充对应区域，不留无意义的边框或空白区域。

【二、上半部分：真实摄影】
完整保留原照片中的主要主体，包括人物、动物、建筑、自然景观、花卉、植物及其他核心元素。准确保留主体身份、数量、比例、姿态、相对位置、空间层次及原有构图关系。保留原始照片的真实材质、自然光线、环境氛围和代表性色彩，只进行轻微、克制的高级摄影调色，使其具有艺术摄影、独立杂志和美术馆展览作品的质感。根据画幅需要，可以自然延伸天空、墙面、水面、地面或环境边缘，但不得扭曲、拉伸、替换、重新设计核心主体，不得改变人物面容、服装和动作，不得改变建筑结构及自然景观的基本形态。清除原始水印及无关平台标识，不添加新的摄影内容。

【三、下半部分：真实景观的参数化重构】
以下半部分作为完整、独立的参数化生成艺术作品，准确提取原照片的主体结构、关键轮廓、明暗关系、空间透视和代表性色彩，将真实场景转化为由数百至上千条极细、连续、柔软、富有韵律的流动曲线构成的梦幻光线世界。线条不是简单叠加在照片表面的条纹滤镜，而是通过曲线的弯曲、拉伸、交织、聚散、疏密、形变及明暗变化，重新塑造原照片中物体的体积、轮廓和空间关系。整体必须保留原照片主体的可辨识性，同时赋予其超现实的流动感和数字雕塑质感。不能简单复制照片后添加描边，也不能将主体完全变成普通写实插画。

【四、核心效果：曲线晕染与自由延伸】
重点强化细线条的曲线形态、层层叠加、自然晕染和向外延伸的效果。线条应像轻柔丝线、空气流场、光纤、烟雾和水流一样，沿主体轮廓生长，并从主体边缘自然向周围空间飘散、伸展、弯曲和汇聚。局部线条呈现宽窄变化、疏密起伏、柔和弧度与连续流动的方向感，形成富有诗意的空间轨迹。部分曲线可从真实物体边缘逐渐脱离，形成半透明的光线尾迹，如光线被风轻轻拉长、如颜料在水中自然渗透、如丝绸在空气中舒展。线条延伸应符合原照片主体形态和画面空间关系，不得成为无意义、机械重复的波浪纹。不同区域应有明确的疏密节奏：视觉焦点附近线条精密细腻，主体外围逐渐舒展、稀疏，并柔和消融于背景。线条须保持连续性和柔软性，呈现自由、轻盈、有呼吸感的流动状态。

【五、光感与梦幻氛围】
大幅强化参数化线条本身的发光质感。细线具有柔和而清晰的发光核心，外围包裹低强度、半透明的漫射光晕，形成细腻的体积光、雾化光、渐隐光轨和空间辉光。光线从主体轮廓、结构交汇处、花瓣边缘、植物叶脉、建筑转角、山体脊线、水面波纹或人物衣物褶皱中自然产生，并顺着连续曲线向周围扩散。高光区域可以形成局部较强的发光聚集，暗部保留丰富层次与柔和阴影，使画面兼具明亮焦点与深邃背景。局部可加入极少量微型光点、细微光尘和柔和光雾，营造如梦境、记忆或光学装置般的氛围。发光需要精致、克制、有层次，不使用粗重霓虹描边，不让所有线条具有完全相同的亮度，不使用刺眼过曝和廉价科幻特效。

【六、不同主体的自适应线条设计】
根据每张照片的主体特征自动调整线条形态，不允许所有照片使用相同的流线模板。
- 山川、雪山、丘陵和峡湾：使用沿山脊与坡面自然起伏的连续等高线，结合向天空舒展的光线曲线，形成发光地形雕塑。
- 河流、湖泊和海洋：使用水平延展的水纹、漩涡状弧线、柔软波浪及局部光晕，突出流动、倒影与空间纵深。
- 建筑与城市：使用沿建筑立面、屋顶、窗格和结构轮廓延伸的竖向或横向精密流线，局部允许曲线自然弯曲、释放与消散，表现建筑被光线重新构建的效果。
- 花卉与植物：使用沿花瓣卷曲方向、叶片脉络和植物自然生长方向分布的精密弧线，使花瓣边缘柔和发光，线条向外如薄纱、丝带和雾气般飘散，营造轻盈梦幻的生命感。
- 人物：保留人物原有身份、姿态和身体比例，通过衣物褶皱、发丝、局部轮廓以及周围环境形成流动细线，人物不宜过度发光或完全变成透明能量体。
- 动物与鸟类：保留原始体态、神情和羽毛或皮毛轮廓，利用局部细线、轻柔光晕和周围环境流线表现轻盈、安静的氛围，避免夸大动物体积。
- 中式园林：围绕树枝、竹叶、屋檐、月洞门、石块、水面和衣裙形成有东方韵律的流动曲线，营造含蓄、空灵、诗意的梦境氛围。
- 云层、极光、天空及雾气：使用大幅度弯曲、层层漂浮、柔和晕染的流场线条，形成具有空气运动感和空间包裹感的抽象光带。
主体的形态决定线条的方向，线条服务于构图，而非强行覆盖主体。

【七、色彩设计】
根据每张原照片的真实色调和艺术氛围，自动提取 3 至 5 种核心颜色，作为下半部分的主要色彩体系。上下两部分应具有明确的色彩关联，但下半部分可以通过更丰富的明暗、发光效果和适当的邻近色变化呈现更梦幻的氛围。森林、荷叶和中式园林以墨绿、竹青、青绿、灰绿、淡金及柔和暖白为主要参考；晚霞与花卉可采用暖橙、杏粉、琥珀、蜜金、玫瑰紫等邻近色；极光和夜景可使用深靛蓝、冰蓝、青绿、冷白等；雪景与浅色动物可使用米白、浅灰、淡粉、雾蓝和低饱和暖金。以上仅为参考，实际颜色必须随照片变化，不得强行套用固定配色。发光颜色应与环境色自然融合，保证整体色彩高级、协调、克制，避免杂乱彩虹渐变和过度饱和。

【八、构图关系与视觉层次】
下半部分应保留与上半部分相同的主要构图骨架，但允许在保持主体结构准确的前提下，通过曲线延伸和光线晕染创造更加丰富的艺术空间。强调主次分明、疏密有致、大面积流动曲线与局部精密细线之间的节奏变化。主体轮廓必须清晰，局部高光吸引视线，外围曲线自然向背景延伸。允许少量线条越过主体边缘进入环境，使主体与背景在光学上彼此连接。画面不应过于规整、平铺或刻板，也不应过度填满，需结合每张照片的自然留白安排线条形变。整体形成真实、抽象、梦幻三者之间的平衡。`;

export const DOUYIN_ITEMS = [
  {
    slug: "y2k-pop-poster",
    zh: "Y2K 波普海报",
    en: "Y2K Pop Poster",
    cat: "graphic",
    kind: "skill",
    description:
      "千禧年蓝黄撞色、金色手枪与粗颗粒黑白人物，把普通照片压成一张喧闹的 Y2K 杂志封面。",
    bestFor: "造型夸张的人像、物件与宠物大头",
    tags: ["Y2K", "波普", "高饱和"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
    repoUrl: "https://github.com/koinu32/y2k-pop-poster",
  },
  {
    slug: "mono-color-skill",
    zh: "单色印刷",
    en: "Mono Color Print",
    cat: "graphic",
    kind: "skill",
    description:
      "只剩一种蓝。百叶窗光影、黑白人物与套印颗粒互相叠压，像一页被蓝色油墨反复印过的时尚内页。",
    bestFor: "五官清晰的人像、建筑与几何静物",
    tags: ["单色", "印刷", "百叶窗"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "silhouette-group-collage",
    zh: "剪影群像拼贴",
    en: "Silhouette Group Collage",
    cat: "graphic",
    kind: "skill",
    description:
      "把合照变成重复出现的人形剪影队列，配以复古红蓝条纹和一句短标语，秩序感与幽默感同时拉满。",
    bestFor: "多人合照、舞蹈、运动与朋友合影",
    tags: ["剪影", "群像", "复古"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "surreal-pop-collage",
    zh: "超现实波普拼贴",
    en: "Surreal Pop Collage",
    cat: "graphic",
    kind: "skill",
    description:
      "照片保留真实色彩，背景被替换成两三种巨大平涂色块，再让一件源自画面的“不可能巨物”登场。真实与荒诞被剪进同一张纸。",
    bestFor: "主体轮廓鲜明、色彩关系清楚的人像或静物",
    tags: ["超现实", "拼贴", "平涂"],
    creator: "Cooper说 × 尘风里",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
    repoUrl: "https://github.com/2998980-hue/surreal-pop-collage",
    prompt: SURREAL_PROMPT,
    promptLabel: "REFERENCE PROMPT / 参考提示词",
  },
  {
    slug: "culture-fragment-poster-engine",
    zh: "文化碎片海报",
    en: "Culture Fragment Poster Engine",
    cat: "graphic",
    kind: "skill",
    description:
      "把地方文化里的器物、年代、文字和照片碎片压进一张高密度海报，像翻到一页被时间磨旧的档案馆。",
    bestFor: "城市文化、博物馆、老物件与地域主题照片",
    tags: ["文化档案", "碎片", "编辑排版"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "daily-photo-playground",
    zh: "日常照片试验场",
    en: "Daily Photo Playground",
    cat: "graphic",
    kind: "skill",
    description:
      "照片被缩成细小而精准的一块，放进大面积米白纸面里，用一条细线、一处小字重新校准日常的观看比例。",
    bestFor: "生活随拍、建筑局部与安静的小物件",
    tags: ["留白", "极简", "编辑"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "paper-spirit-zine",
    zh: "纸灵 Zine",
    en: "Paper Spirit Zine",
    cat: "graphic",
    kind: "skill",
    description:
      "真实摄影与黑色墨线并置：人物、猫或一件家具被手绘成另一个自己，像一本自己装订的独立小志。",
    bestFor: "人物、宠物与形状明确的日常物件",
    tags: ["Zine", "墨线", "纸感"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "gathered-scenes-zine-skill",
    zh: "实景拼贴 Zine",
    en: "Gathered Scenes Zine",
    cat: "scene",
    kind: "skill",
    description:
      "照片沿主体轮廓被撕开，摄影与纸张插画从裂口两边彼此生长；只用一种高饱和印刷色，把风景重新缝合。",
    bestFor: "城市、建筑、山河与旅行纪实",
    tags: ["撕纸", "实景拼贴", "旅行"],
    creator: "拾光少年📸 × 尘风里",
    collection: "Gathered Scenes Zine / v1.3",
    postUrl: POST.zine,
    repoUrl: "https://github.com/liuyutian198-stack/gathered-scenes-zine-skill",
    prompt: GATHERED_PROMPT,
    promptLabel: "GATHERED SCENES ZINE v1.3 / 参考提示词",
  },
  {
    slug: "photo-relic-editorial",
    zh: "照片遗迹编辑",
    en: "Photo Relic Editorial",
    cat: "graphic",
    kind: "skill",
    description:
      "照片像一件被反复归档的遗物：褪色、裁切、留白与极轻的印刷网点，让日常场景带上时间的温度。",
    bestFor: "旧物、建筑局部、植物与安静的室内",
    tags: ["褪色", "档案", "编辑"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "photo-to-travel-sketch",
    zh: "照片转旅行速写",
    en: "Photo to Travel Sketch",
    cat: "scene",
    kind: "skill",
    description:
      "上半张是旅行照片，下半张交给速写：断续的线条、少量透明淡彩和留白，像一本边走边画的旅行笔记。",
    bestFor: "街景、建筑、山野与旅行中的人",
    tags: ["速写", "淡彩", "旅行"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "heytea-style",
    zh: "喜茶风海报",
    en: "Heytea Style Poster",
    cat: "graphic",
    kind: "skill",
    description:
      "奶油白底、亮橙点缀和轻轻歪斜的手写大字，把食物或人像做成一张轻快、很像新品发布的新茶饮海报。",
    bestFor: "饮品、食物、产品和轻松的人像",
    tags: ["茶饮", "食品海报", "明亮"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "neil-quentin",
    zh: "Neil Quentin 拼贴",
    en: "Neil Quentin Collage",
    cat: "portrait",
    kind: "skill",
    description:
      "真实照片与夸张的手绘人物并排出现，运动姿态被拉长，像一张跨页时装插画，也像一张会动的街拍。",
    bestFor: "穿搭、舞蹈、运动与有肢体张力的人像",
    tags: ["拼贴插画", "时尚", "运动"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "kodak-2383-film-look",
    zh: "柯达 2383 胶片",
    en: "Kodak 2383 Film Look",
    cat: "scene",
    kind: "skill",
    description:
      "柯达 2383 式的胶片色彩：高光柔、暗部厚、饱和度克制，一张风景照因此拥有了电影静帧的气息。",
    bestFor: "日落、天空、海岸、城市远景",
    tags: ["胶片", "电影感", "低饱和"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "photo-abstract-editorial",
    zh: "照片抽象编辑",
    en: "Photo Abstract Editorial",
    cat: "graphic",
    kind: "skill",
    description:
      "照片被拆成平面色块和流动图形，绿、粉、黑彼此挤压，像一页前卫时装杂志，只留下身体和颜色的关系。",
    bestFor: "时装、造型和身体局部的照片",
    tags: ["抽象", "时装", "色块"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "tait-crt-interface-skill",
    zh: "TAIT CRT 界面",
    en: "TAIT CRT Interface",
    cat: "graphic",
    kind: "skill",
    description:
      "CRT 扫描线、绿色数据字与旧式仪表盘覆盖在照片上，让建筑和城市看起来像一段从旧电脑里读出的影像。",
    bestFor: "建筑、设备、夜景与城市景观",
    tags: ["CRT", "界面", "复古科技"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "zone-material-art",
    zh: "ZONE 材质图鉴",
    en: "ZONE Material Art",
    cat: "object",
    kind: "skill",
    description:
      "把照片里的风景拆成材质样本：纸张、织物、色卡和自然物被整齐排列，像一份关于地方的材料研究。",
    bestFor: "植物、自然物、室内与器物",
    tags: ["材质", "标本", "研究"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "travel-memory-sticker-card",
    zh: "旅行记忆贴纸卡",
    en: "Travel Memory Sticker Card",
    cat: "scene",
    kind: "skill",
    description:
      "照片、票根、手写地名和小贴纸被拼成一张旅行记忆卡。像从手账里撕下的一页，也像一张可以寄出的纪念品。",
    bestFor: "城市、海边、酒店与旅行人像",
    tags: ["贴纸", "旅行", "手账"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
    repoUrl: "https://github.com/carolinaaafy/travel-memory-sticker-card",
  },
  {
    slug: "skill-make-photo-stamp-archive",
    zh: "照片邮票档案",
    en: "Photo Stamp Archive",
    cat: "object",
    kind: "skill",
    description:
      "照片被裁成邮票、印刷样张和小型档案卡，花朵、器物与日常碎片被收进一套温柔的收藏系统。",
    bestFor: "花卉、器物、食物与静物",
    tags: ["邮票", "档案", "纸品"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "vinyl-image-generator",
    zh: "黑胶唱片生成器",
    en: "Vinyl Image Generator",
    cat: "object",
    kind: "skill",
    description:
      "照片被装进黑胶唱片与透明封套：唱片、封底、标签和印刷纹理一应俱全，像一张真正发行过的专辑。",
    bestFor: "人像、城市、风景与有封面感的构图",
    tags: ["黑胶", "封套", "印刷"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "pixel-style-poster-skill",
    zh: "像素风海报",
    en: "Pixel Style Poster",
    cat: "graphic",
    kind: "skill",
    description:
      "用低分辨率像素块重画照片，保留轮廓却让细节故意粗糙化，像从旧游戏机里截下的一帧。",
    bestFor: "静物、人物与形状清楚的场景",
    tags: ["像素", "游戏感", "海报"],
    creator: "Cooper说",
    collection: "抖音 · 20 个热门生图 Skill",
    postUrl: POST.twenty,
  },
  {
    slug: "watercolor-travel-card",
    zh: "水彩旅行卡",
    en: "Watercolor Travel Card",
    cat: "scene",
    kind: "skill",
    description:
      "把照片变成清透的钢笔水彩旅行卡：保留主体特征，加入齿孔、英文标题与旅行档案栏，适合做成收藏票卡式海报。",
    bestFor: "旅行风景、建筑、人物全身与街景",
    tags: ["水彩", "邮票", "旅行"],
    creator: "小麦果汁AI",
    collection: "抖音 · 6 个旅行废片 Skill",
    postUrl: POST.travel,
    repoUrl: `${GZ}/watercolor-travel-card`,
  },
  {
    slug: "impasto-miniature-landscape",
    zh: "厚涂油画微景观",
    en: "Impasto Miniature Landscape",
    cat: "scene",
    kind: "skill",
    description:
      "照片主体被重构成带颜料堆积、刮刀纹理和雕塑体积的厚涂微缩景观，明亮、温暖，有真实的笔触重量。",
    bestFor: "草原、动物、树木、山野与开阔风景",
    tags: ["厚涂", "刮刀", "微缩"],
    creator: "小麦果汁AI",
    collection: "抖音 · 6 个旅行废片 Skill",
    postUrl: POST.travel,
    repoUrl: `${GZ}/impasto-miniature-landscape`,
  },
  {
    slug: "isometric-healing-blocks",
    zh: "3D 等距积木",
    en: "Isometric Healing Blocks",
    cat: "scene",
    kind: "skill",
    description:
      "分析照片中的主体结构和空间关系，把它重组成圆润柔和的等距积木雕塑，童趣但不幼稚。",
    bestFor: "人物坐姿、野餐、房间与空间关系明确的照片",
    tags: ["等距", "积木", "治愈"],
    creator: "小麦果汁AI",
    collection: "抖音 · 6 个旅行废片 Skill",
    postUrl: POST.travel,
    repoUrl: `${GZ}/isometric-healing-blocks`,
  },
  {
    slug: "pixel-dissolve-landscape",
    zh: "像素消隐景观",
    en: "Pixel Dissolve Landscape",
    cat: "scene",
    kind: "skill",
    description:
      "从照片中提炼最醒目的视觉锚点，用限色像素块重新搭建，再让外围一格格消失在纸面留白里。",
    bestFor: "城市街道、山野与主体清晰的风景",
    tags: ["像素", "消隐", "留白"],
    creator: "小麦果汁AI",
    collection: "抖音 · 6 个旅行废片 Skill",
    postUrl: POST.travel,
    repoUrl: `${GZ}/pixel-dissolve-landscape`,
  },
  {
    slug: "observational-pen-wash",
    zh: "观察性钢笔淡彩",
    en: "Observational Pen Wash",
    cat: "scene",
    kind: "skill",
    description:
      "把照片变成极简钢笔线稿与少量透明淡彩，断续线条、观察痕迹和大面积留白，像一页私人旅行手记。",
    bestFor: "人物、咖啡馆、街景与静物",
    tags: ["钢笔", "淡彩", "手记"],
    creator: "小麦果汁AI",
    collection: "抖音 · 6 个旅行废片 Skill",
    postUrl: POST.travel,
    repoUrl: `${GZ}/observational-pen-wash`,
  },
  {
    slug: "papercraft-travel-diorama",
    zh: "纸艺旅行微缩景观",
    en: "Papercraft Travel Diorama",
    cat: "scene",
    kind: "skill",
    description:
      "照片里的主体与环境被做成纸张、卡纸或薄木的 3D 微缩场景，精致、柔和，有看得见的手工触感。",
    bestFor: "建筑、动物、人物与旅行场景",
    tags: ["纸艺", "微缩", "手工"],
    creator: "小麦果汁AI",
    collection: "抖音 · 6 个旅行废片 Skill",
    postUrl: POST.travel,
    repoUrl: `${GZ}/papercraft-travel-diorama`,
  },
  {
    slug: "starryear-artifact-collage",
    zh: "年·文物五拼",
    en: "Starryear Artifact Collage",
    cat: "object",
    kind: "skill",
    description:
      "把博物馆随手拍的几件文物放到同一张画里：上方保留现场照片，下方重新安排大小、位置与关系，让隔着展柜的器物相遇。",
    bestFor: "博物馆随手拍、器物、建筑细节",
    tags: ["文物", "拼贴", "博物馆"],
    creator: "Starryear年",
    collection: "Starryear Skill / S.013",
    postUrl: POST.museum,
  },
  {
    slug: "travel-memory-card-duo",
    zh: "旅行手帐记忆卡",
    en: "Travel Memory Card Duo",
    cat: "scene",
    kind: "skill",
    description:
      "上半张完整保留旅行原片，下半张生成一本摊开的手账；同一张照片还会拆出六枚透明底贴纸。",
    bestFor: "旅行、街景、建筑、人物、宠物与生活照",
    tags: ["手账", "旅行", "贴纸"],
    creator: "李大埜",
    collection: "Travel Memory Card Duo",
    postUrl: POST.diary,
    repoUrl: "https://github.com/carolinaaafy/travel-memory-card-duo",
  },
  {
    slug: "knitted-zine-poster",
    zh: "针织 Zine 海报",
    en: "Knitted Zine Poster",
    cat: "graphic",
    kind: "skill",
    description:
      "把旅行照片变成毛线、绒布和刺绣拼成的 Zine 海报，风景与人物都带上柔软、可触摸的手作质感。",
    bestFor: "旅行、动物、人物与开阔风景",
    tags: ["针织", "Zine", "毛毡"],
    creator: "兔七哥 SevenEvans",
    collection: "抖音 · 针织艺术海报",
    postUrl: POST.knit,
  },
  {
    slug: "ink-diptych-postcard",
    zh: "水墨双联明信片",
    en: "Ink & Paper Diptych",
    cat: "prompt",
    kind: "prompt",
    description:
      "一张竖向二分的哑光米白明信片：上半区严格保留写实摄影，下半区用水墨平涂重构同一片风景，只留下结构与留白。",
    bestFor: "建筑、山水、海边等留白充足的风景",
    tags: ["水墨", "双联", "明信片"],
    creator: "尘风里",
    collection: "豆包提示词 / Prompt",
    postUrl: POST.prompts,
    prompt: INK_DIPTYCH_PROMPT,
    promptLabel: "PROMPT / 完整提示词",
  },
  {
    slug: "parametric-light-art",
    zh: "参数化流光",
    en: "Parametric Light Art",
    cat: "prompt",
    kind: "prompt",
    description:
      "上半区保留真实照片，下半区把同一场景拆成数百上千条流动光线。真实与数字梦境在同一条水平线两侧互相对应。",
    bestFor: "城市、自然、花卉、建筑与人物",
    tags: ["流光", "参数化", "双重现实"],
    creator: "李大埜",
    collection: "豆包提示词 / Prompt",
    postUrl: POST.light,
    prompt: LIGHT_ART_PROMPT,
    promptLabel: "PROMPT / 完整提示词",
  },
];
