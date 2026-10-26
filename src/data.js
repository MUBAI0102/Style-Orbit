import { PHOTO_DATA } from "./photos.js";
import { DOUYIN_ITEMS } from "./douyin.js";
import { getStoredCustomEntries, makePlaceholderSvg } from "./custom-library.js";

export const REPO_URL = "https://github.com/Vieeeeeee/wibi-style";
export const AUTHOR = "@威比 Hunter Wei.";

export const CATEGORIES = {
  portrait: {
    label: "人像",
    en: "PORTRAIT",
    color: "#ff4f8b",
    soft: "rgba(255, 79, 139, .16)",
  },
  kid: {
    label: "童趣",
    en: "CHILDHOOD",
    color: "#ffd45a",
    soft: "rgba(255, 212, 90, .14)",
  },
  scene: {
    label: "场景",
    en: "SCENE / POSTER",
    color: "#45e5ff",
    soft: "rgba(69, 229, 255, .14)",
  },
  space: {
    label: "家居",
    en: "INTERIOR",
    color: "#ff863f",
    soft: "rgba(255, 134, 63, .15)",
  },
  object: {
    label: "万物",
    en: "OBJECT / PET",
    color: "#b395ff",
    soft: "rgba(179, 149, 255, .15)",
  },
  lab: {
    label: "进阶",
    en: "EXPERIMENT",
    color: "#cbff45",
    soft: "rgba(203, 255, 69, .13)",
  },
  graphic: {
    label: "平面",
    en: "GRAPHIC / TYPE",
    color: "#7d8bff",
    soft: "rgba(125, 139, 255, .15)",
  },
  prompt: {
    label: "提示词",
    en: "PROMPT",
    color: "#9dffd0",
    soft: "rgba(157, 255, 208, .13)",
  },
};

/*
 * Every entry is one installable visual style Skill from Wibi Style.
 * Descriptions are editorial Chinese summaries written for this gallery;
 * "bestFor" and "group" come from the repository's Chinese catalogue.
 */
const RAW_SKILLS = [
  {
    slug: "electric-blue-halftone-poster",
    zh: "电蓝网点海报",
    en: "Electric Blue Halftone Poster",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "单人人像或宠物大头照",
    description:
      "高反差黑白大头被粗网点打印，砸进一整块电光蓝。红黄星星与白色条码，把一张照片变成 Y2K 复印海报。",
    tags: ["粗网点", "Y2K", "大头海报"],
  },
  {
    slug: "alt-manga-avatar",
    zh: "粗线条漫画头像",
    en: "Bold Line Manga Avatar",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "正面或半侧脸自拍",
    description:
      "墨黑粗线勾出轮廓，大面积留白吞掉细节，再用灰色网点压出阴影。像从独立漫画里裁下的一格人物特写。",
    tags: ["粗线条", "黑白漫画", "高对比"],
  },
  {
    slug: "art-print-poster",
    zh: "蜡笔手绘头像",
    en: "Crayon Sketch Avatar",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "五官清楚、表情有记忆点的自拍",
    description:
      "自拍被重画成带蜡笔颗粒的扁平面孔，配一块柔粉背景。五官被轻轻夸张但不失真，像一张会呼吸的手绘印刷品。",
    tags: ["蜡笔质感", "扁平插画", "柔粉"],
  },
  {
    slug: "dark-red-black-cel-shaded",
    zh: "暗夜红黑赛璐璐",
    en: "Dark Red & Black Cel Shade",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "适合戏剧性红黑光影的人物照片",
    description:
      "硬边赛璐璐阴影切开面部，红与黑把光变成戏剧。适合一张有情绪的脸，在暗处持续发光。",
    tags: ["红黑", "赛璐璐", "戏剧光"],
  },
  {
    slug: "iridescent-long-exposure",
    zh: "虹彩柔焦长曝光",
    en: "Iridescent Long Exposure",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "想要朦胧氛围的近景或局部特写",
    description:
      "让照片在时间里轻微融化：虹彩拖影、柔焦与漏光叠成一场慢门。轮廓不再清晰，情绪却被放大。",
    tags: ["长曝光", "虹彩", "梦幻"],
  },
  {
    slug: "blue-retro-print",
    zh: "蓝底复古印刷",
    en: "Blue Retro Print",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "轮廓和神态清楚的人物照片",
    description:
      "深蓝墨色压过照片，颗粒与套印错位带来老印刷物的触感。像一本九十年代音乐杂志遗失的内页。",
    tags: ["复古印刷", "蓝调", "颗粒"],
  },
  {
    slug: "underground-audition",
    zh: "地下试镜卡",
    en: "Underground Audition Skill",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "单人半身或大头照，做成冷调直闪三联转身卡",
    description:
      "冷调直闪、左中右三格转身，像试镜卡带里的连续定格。没有多余装饰，只有一张被镜头审视的脸。",
    tags: ["三联卡", "直闪", "CCD"],
  },
  {
    slug: "textile-toy-portrait",
    zh: "颗粒绒感玩偶",
    en: "Textile Toy Portrait",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "发型、表情、配饰和手部关系明确的单人照",
    description:
      "皮肤、头发和配饰都被翻译成毛线、绒布与缝线。照片被织成一个手工感极强的玩偶分身。",
    tags: ["毛绒质感", "手工玩偶", "布艺"],
  },
  {
    slug: "cold-blue-glitch-anime",
    zh: "冷蓝失真动漫",
    en: "Cold Blue Glitch Anime",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "人物写真、自拍、街头抓拍或夜景生活照",
    description:
      "冷蓝动漫色覆盖现实，故障信号轻轻撕开图像。人物的眼神留在失真边缘，像一段没有加载完的动画。",
    tags: ["冷蓝", "故障", "动漫"],
  },
  {
    slug: "crayon-flat-naive",
    zh: "蜡笔极简扁平画",
    en: "Crayon Flat Naive",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "头像、半身、全身和坐姿，保留穿搭与动作",
    description:
      "去掉透视和立体感，用扁平的色块与歪歪扭扭的线保留穿搭和动作。像小朋友认真画下的大人。",
    tags: ["扁平", "蜡笔", "稚拙"],
  },
  {
    slug: "serpent-line-ink",
    zh: "蛇发游线墨绘",
    en: "Serpent Line Ink",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "单人头肩、近景或半身肖像，自拍与镜面自拍",
    beta: true,
    description:
      "发丝变成游走的细蛇，线条在暖白纸上纠缠。一幅带着一点危险感的墨线肖像，细节只留给眼睛。",
    tags: ["线描", "墨绘", "留白"],
  },
  {
    slug: "warm-paper-crayon-street",
    zh: "暖纸蜡笔街拍",
    en: "Warm Paper Crayon Street",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "街拍、全身或半身人像；半身照不补腿脚",
    description:
      "将街拍变成暖纸上的蜡笔编辑插画：粗颗粒、随意的手写英文、大片纸面留白。像旅行途中撕下的一页。",
    tags: ["街拍", "蜡笔", "编辑设计"],
  },
  {
    slug: "retro-flat-anime-head",
    zh: "复古扁平动画头",
    en: "Retro Flat Anime Head",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "正面或半侧脸清楚、发型和表情可辨的单人照",
    description:
      "高饱和复古平涂包裹住头部，发丝和眼神被简化成几何块面。像一帧来自八十年代动画的静止画面。",
    tags: ["复古动画", "扁平", "高饱和"],
  },
  {
    slug: "cream-paper-doodle",
    zh: "奶油纸涂鸦漫画",
    en: "Cream Paper Doodle",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "表情、动作清楚的人像及人与宠物合照",
    description:
      "一张奶油色纸、一支蓝黑笔，用松散的涂鸦线条抓住人物和宠物最像的瞬间。日常因此有了手感。",
    tags: ["纸感", "涂鸦", "日常"],
  },
  {
    slug: "mini-selfie",
    zh: "俯拍迷你自拍",
    en: "Mini Selfie",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "清晰的成年单人自拍，高空俯拍巨头迷你小人",
    beta: true,
    description:
      "俯拍视角把大头拉到前景，身体缩成迷你模型，落在极简的地面块面上。荒诞比例，却异常上镜。",
    tags: ["俯拍", "迷你", "大头"],
  },
  {
    slug: "sunny-gouache",
    zh: "晴彩手绘",
    en: "Sunny Gouache Portraits",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "单人、双人生活照，保留穿搭与互动关系",
    beta: true,
    description:
      "把人像画成明亮的手绘水粉，留下衣服和动作的细节。像晴天午后翻开的一本生活手账。",
    tags: ["水粉", "明亮", "手绘"],
  },
  {
    slug: "paper-portrait-cd",
    zh: "纸上人物志 · CD 版",
    en: "Paper Portrait CD",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "人物动作与穿搭，橙底插画封面",
    description:
      "橙色封面、纸上小人、透明 CD 盒。日常人像被装进一个带着千禧年气味的实体唱片壳。",
    tags: ["CD 壳", "纸艺", "封面设计"],
  },
  {
    slug: "blue-paper-manga-type",
    zh: "蓝纸漫画大字海报",
    en: "Blue Paper Manga Type",
    cat: "portrait",
    group: "人像 · 自拍",
    bestFor: "人物日常照，喜欢漫画感与大字排版",
    description:
      "蓝纸、漫画线稿和与照片相关的英文大字互相挤压，像一张被字体设计彻底占领的日常海报。",
    tags: ["蓝纸", "大字排版", "漫画"],
  },
  {
    slug: "lofi-print-anime",
    zh: "低清晰印刷感动漫",
    en: "Lo-Fi Print Anime",
    cat: "portrait",
    group: "人像 · 低清头像",
    bestFor: "表情、发型和眼镜、帽子等特征可辨的单人近照",
    description:
      "降低清晰度、错位印刷、叠上低像素色彩，把自拍变成一帧被反复翻录的动画截图。",
    tags: ["低保真", "印刷错位", "动画"],
  },
  {
    slug: "diamond-kid-head-card",
    zh: "钻牙萌娃大头",
    en: "Diamond Grin Kid Portrait",
    cat: "kid",
    group: "儿童 · 童年",
    bestFor: "脸、头发或帽子大致可辨的单人儿童照",
    description:
      "只留下孩子的头，悬浮在干净的彩色背景上；露齿时嵌入满钻牙。像从童年纪念册里剪下的一张贴纸。",
    tags: ["萌娃", "贴纸", "钻牙"],
  },
  {
    slug: "kid-head-card",
    zh: "童年大头卡贴",
    en: "Childhood Head Card",
    cat: "kid",
    group: "儿童 · 童年",
    bestFor: "儿童老照片；也能把当代自拍倒推成 5–8 岁",
    description:
      "把儿童旧照重建为明亮棚拍，或把成年自拍倒带回五到八岁。头部成为一张干净、没有身体的童年卡贴。",
    tags: ["童年", "棚拍", "卡贴"],
  },
  {
    slug: "fisheye-city-cover",
    zh: "鱼眼城市海报",
    en: "Fisheye City Poster",
    cat: "scene",
    group: "合照 · 海报",
    bestFor: "城市、街拍与多人旅行照",
    beta: true,
    description:
      "Y2K 强鱼眼、全银标题和旧数码噪点，把城市与合照卷成一张立体杂志封面。世界在边缘失衡。",
    tags: ["鱼眼", "Y2K", "城市封面"],
  },
  {
    slug: "niulai-movie-poster",
    zh: "牛来电影海报",
    en: "Niu Lai Movie Poster",
    cat: "scene",
    group: "合照 · 海报",
    bestFor: "横版单人、双人或三人合照",
    description:
      "牛头、老动画与低预算电影质感。一张普通合照，被认真又荒诞地包装成牛皮电影海报。",
    tags: ["电影海报", "牛头", "复古动画"],
  },
  {
    slug: "minimal-pet-doodle",
    zh: "宠物极简线条",
    en: "Minimal Pet Line Art",
    cat: "object",
    group: "宠物",
    bestFor: "单只猫狗，动作、视线和身体轮廓清楚",
    description:
      "只留几笔黑线勾勒动作，再给毛发抹一小块彩铅色。大片留白，让宠物变成纸上的一口呼吸。",
    tags: ["宠物", "极简", "彩铅"],
  },
  {
    slug: "marker-child-doodle",
    zh: "马克笔童画",
    en: "Marker-Pen Child Doodle",
    cat: "object",
    group: "万物皆可",
    bestFor: "人物、宠物和互动道具清楚的真实照片",
    description:
      "用马克笔的粗线条和纯色块重画照片，一切都像孩子眼里那样直接、歪斜、鲜艳。",
    tags: ["马克笔", "童画", "纯色块"],
  },
  {
    slug: "quirky-pop-doodle-sticker",
    zh: "怪趣波普涂鸦贴纸",
    en: "Quirky Pop Doodle Sticker",
    cat: "object",
    group: "万物皆可",
    bestFor: "动作和轮廓有记忆点的人物、宠物、产品或道具",
    description:
      "人物、宠物或物件被描上粗黑边，贴纸一样浮在明快色场上。古怪、轻快，像从手账里跳出来。",
    tags: ["贴纸", "波普", "涂鸦"],
  },
  {
    slug: "photo-perler-charm",
    zh: "照片拼豆挂件",
    en: "Photo Perler Charm",
    cat: "object",
    group: "万物皆可",
    bestFor: "人物、宠物、花束、食物和轮廓清晰的物件",
    description:
      "照片里的轮廓被重排成一颗颗拼豆，像素化的颗粒变成可爱挂件的物理质感。",
    tags: ["拼豆", "像素", "手作"],
  },
  {
    slug: "pixel-stretch",
    zh: "像素切片拉伸",
    en: "Pixel Slice Stretch",
    cat: "object",
    group: "万物皆可",
    bestFor: "主体清楚的人物、静物或其他照片",
    description:
      "沿水平方向拉扯像素切片，让主体在数字断层中拉伸。照片像遭遇了一次缓慢的信号故障。",
    tags: ["像素", "拉伸", "故障"],
  },
  {
    slug: "glitch-pixel-collage",
    zh: "乱码像素拼贴",
    en: "Glitch Pixel Collage",
    cat: "object",
    group: "万物皆可",
    bestFor: "人物、静物或色彩层次明确的照片",
    description:
      "照片被切碎、错位重拼，再撒上像素噪点。人物从乱码般的碎片里重新成形，看向你。",
    tags: ["拼贴", "故障", "碎片"],
  },
  {
    slug: "office-animals",
    zh: "牛马宇宙",
    en: "Office Animals",
    cat: "object",
    group: "万物皆可",
    bestFor: "指定动物与办公室场景，生成 Y2K 荒诞海报",
    description:
      "工作内容与动物主角被拼成一张 Y2K 荒诞办公室海报，严肃排版里全是牛马幽默。",
    tags: ["办公室", "动物", "Y2K"],
  },
  {
    slug: "personalized-print-ticket",
    zh: "定制印刷票根",
    en: "Personalized Print Ticket",
    cat: "object",
    group: "万物皆可",
    bestFor: "人物、旅行、街景、建筑、食物与日常随拍",
    description:
      "自动写中英文纪念文案，把照片放进四种印刷票根之一。日常随拍变成一张可以撕下的纪念品。",
    tags: ["票根", "编辑排版", "纪念"],
  },
  {
    slug: "clear-sky-urban-cel",
    zh: "晴空都市赛璐璐",
    en: "Clear Sky Urban Cel",
    cat: "scene",
    group: "场景 · 美食",
    bestFor: "城市街道、建筑、旅行纪实、交通设施",
    description:
      "把城市变成高饱和赛璐璐动画背景：湛蓝天空、利落建筑和干净的空气感。像故事开场前的三秒钟。",
    tags: ["城市场景", "赛璐璐", "晴空"],
  },
  {
    slug: "primary-hardlight-city",
    zh: "原色硬光都市",
    en: "Primary Hardlight City",
    cat: "scene",
    group: "场景 · 美食",
    bestFor: "城市街道、建筑、公共交通与环境人物照片",
    description:
      "红黄蓝三原色硬光切开街道与建筑，现实城市被压成一张强烈的平面海报。",
    tags: ["三原色", "硬光", "都市"],
  },
  {
    slug: "retro-table-print",
    zh: "复古餐桌杂志",
    en: "Retro Table Magazine",
    cat: "scene",
    group: "场景 · 美食",
    bestFor: "能看清菜和器皿的餐桌照，整桌或单盘都行",
    description:
      "把餐桌照排进复古杂志版式：印刷红、食物特写和手写标注，让一顿饭拥有出版物的仪式感。",
    tags: ["美食", "复古杂志", "印刷红"],
  },
  {
    slug: "museum-impression-oil",
    zh: "馆藏印象油画",
    en: "Museum Impression Oil",
    cat: "scene",
    group: "场景 · 美食",
    bestFor: "街景、乡村、道路、山野、河岸与海岸风景",
    description:
      "风景被化为印象派的笔触、湿画法与柔光，再装进美术馆展签式的留白里。日常风景成为馆藏。",
    tags: ["印象派", "风景", "油画"],
  },
  {
    slug: "paper-flat-vignette",
    zh: "留白平涂小景",
    en: "Paper Flat Vignette",
    cat: "scene",
    group: "场景 · 美食",
    bestFor: "街拍、咖啡店、书店、旅行和日常人像",
    description:
      "照片被收进暖白纸中央的一幅平涂小画。人物、空间和物件都被简化成温柔的形状。",
    tags: ["纸感", "平涂", "小景"],
  },
  {
    slug: "home-journal",
    zh: "复古家居日志",
    en: "Vintage Home Journal",
    cat: "space",
    group: "家居 · 空间",
    bestFor: "客厅、卧室、咖啡台、书架等家居随手拍",
    description:
      "家居角落被画成带编号与标注的复古日志。咖啡机、书架和椅子，突然都有了各自的小传。",
    tags: ["家居", "手账", "复古"],
  },
  {
    slug: "cream-home-sketch",
    zh: "奶油纸复古家居速写",
    en: "Cream Home Sketch",
    cat: "space",
    group: "家居 · 空间",
    bestFor: "家居角落、植物、茶具和日式房间",
    beta: true,
    description:
      "奶油纸、留白、灰线与一点淡彩，把植物、茶具和房间速写成一个安静的日式生活切片。",
    tags: ["家居速写", "留白", "日式"],
  },
  {
    slug: "wibi-frame",
    zh: "框景漫画",
    en: "Framed Comic Panel",
    cat: "lab",
    group: "进阶 · 多步骤",
    bestFor: "有清楚眼神、表情、手势或物件关系的照片",
    description:
      "先挑选照片里最值得看的局部，再把它框成漫画格。多一步选择，换来更准确的情绪特写。",
    tags: ["多步骤", "漫画分镜", "局部"],
  },
  {
    slug: "urban-mecha-cel",
    zh: "都市机械赛璐璐",
    en: "Urban Mecha Cel",
    cat: "portrait",
    group: "人像 · 表情动作",
    bestFor: "清晰自拍、随手拍和废片都可以",
    description:
      "把自拍和废片重画成白底红衣的粗线漫画角色。机械结构、都市噪音与松弛表情撞在一起。",
    tags: ["机甲", "赛璐璐", "粗线"],
  },
  {
    slug: "red-blue-fashion-manga",
    zh: "红蓝手绘时装",
    en: "Red & Blue Fashion Manga",
    cat: "portrait",
    group: "人像 · 表情动作",
    bestFor: "单人穿搭与街拍，适合海报式排版",
    description:
      "红与蓝的时装漫画海报，按照片自动生成大字排版。穿搭与姿态成为绝对主角。",
    tags: ["时装", "红蓝", "杂志海报"],
  },
  {
    slug: "bold-line-fashion",
    zh: "粗线手绘穿搭插画",
    en: "Bold Line Fashion",
    cat: "portrait",
    group: "人像 · 表情动作",
    bestFor: "穿搭和姿态清楚的街拍或坐姿照片",
    beta: true,
    description:
      "浅灰底、黑色粗轮廓和大量留白。穿搭照被翻译成姿态感极强的时装插画，衣服比人先说话。",
    tags: ["时装插画", "粗轮廓", "留白"],
  },
  {
    slug: "orange-navy-fashion",
    zh: "橙底蓝墨时装漫画",
    en: "Orange & Navy Fashion Manga",
    cat: "portrait",
    group: "人像 · 表情动作",
    bestFor: "单人穿搭、半身与近景照片",
    beta: true,
    description:
      "橙色底、海军蓝墨线、方形构图，人物像从一本复古时装杂志里直接走出来。",
    tags: ["橙蓝", "时装漫画", "方图"],
  },
  {
    slug: "warm-naive-comic",
    zh: "暖彩粗线日常漫画",
    en: "Warm Naive Comic",
    cat: "portrait",
    group: "人像 · 表情动作",
    bestFor: "表情鲜明的人像、日常动作及人与宠物",
    beta: true,
    description:
      "暖色、粗线和略微笨拙的形体，让日常动作和表情变得亲切。像一页颜色很好吃的漫画。",
    tags: ["日常漫画", "暖彩", "粗线"],
  },
];

export const WIBI_COUNT = RAW_SKILLS.length;
export const DOUYIN_COUNT = DOUYIN_ITEMS.length;
const LOCAL_RAW = getStoredCustomEntries();
const usedSlugs = new Set([...RAW_SKILLS, ...DOUYIN_ITEMS].map((skill) => skill.slug));
const LOCAL_ITEMS = LOCAL_RAW.map((entry) => {
  let slug = entry.slug || `local-${entry.customId.slice(-8)}`;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${entry.slug}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(slug);
  return { ...entry, slug };
});
export const LOCAL_COUNT = LOCAL_ITEMS.length;
export const BUILTIN_COUNT = WIBI_COUNT + DOUYIN_COUNT;

export const SKILLS = [...RAW_SKILLS, ...DOUYIN_ITEMS, ...LOCAL_ITEMS].map((skill, index) => {
  const category = CATEGORIES[skill.cat] || CATEGORIES.scene;
  const isLocal = skill.sourceType === "local" || skill.isCustom === true;
  const isDouyin = !isLocal && (skill.sourceType === "douyin" || skill.postUrl !== undefined);
  const isPrompt = skill.kind === "prompt";
  const repoSearchUrl = `https://github.com/search?q=${encodeURIComponent(skill.slug)}&type=repositories`;
  const repoUrl = isLocal ? null : skill.repoUrl || (isDouyin && !isPrompt ? repoSearchUrl : null);
  const sourceLabel = isLocal
    ? isPrompt
      ? "LOCAL PROMPT"
      : "LOCAL SKILL"
    : isDouyin
      ? isPrompt
        ? "DOUYIN PROMPT"
        : "DOUYIN SKILL"
      : "GITHUB SKILL";
  const sourceUrl = isLocal
    ? skill.sourceUrl || ""
    : isDouyin
      ? skill.postUrl
      : `${REPO_URL}/tree/main/skills/${skill.slug}`;

  return {
    ...skill,
    index: index + 1,
    id: String(index + 1).padStart(2, "0"),
    accent: category.color,
    accentSoft: category.soft,
    categoryLabel: category.label,
    categoryEn: category.en,
    image: isLocal
      ? skill.image || makePlaceholderSvg(skill.zh, category.color, isPrompt)
      : PHOTO_DATA[skill.slug],
    kind: isPrompt ? "prompt" : "skill",
    sourceType: isLocal ? "local" : isDouyin ? "douyin" : "github",
    sourceLabel,
    creator: skill.creator || (isLocal ? "我" : AUTHOR),
    collection: skill.collection || (isLocal ? "我的本机收藏" : `Wibi Style · ${skill.group}`),
    sourceUrl,
    repoUrl,
    repoLabel: repoUrl
      ? skill.repoUrl
        ? "在 GitHub 查看 Skill"
        : "在 GitHub 搜索同名 Skill"
      : "",
    installUrl: isLocal
      ? "本地条目只保存在这台电脑上"
      : isPrompt
        ? "将下方完整提示词与照片一起发送给支持图像输入的模型"
        : isDouyin && repoUrl
          ? `请安装这个 Skill：\n${repoUrl}`
          : `请安装这个 Skill：\n${REPO_URL}/tree/main/skills/${skill.slug}`,
    usage: isPrompt
      ? "将这张照片与下方完整提示词一起发送给图像模型"
      : `使用 $${skill.slug} 处理这张照片`,
    isCustom: isLocal,
    customId: isLocal ? skill.customId : null,
  };
});

export const TOTAL_COUNT = SKILLS.length;
export const SKILL_COUNT = SKILLS.filter((skill) => skill.kind === "skill").length;
export const PROMPT_COUNT = SKILLS.filter((skill) => skill.kind === "prompt").length;

export const CATEGORY_COUNTS = Object.keys(CATEGORIES).reduce((acc, key) => {
  acc[key] = SKILLS.filter((skill) => skill.cat === key).length;
  return acc;
}, {});

export const getSkillBySlug = (slug) =>
  SKILLS.find((skill) => skill.slug === slug) || null;

export const getSkillByCustomId = (customId) =>
  SKILLS.find((skill) => skill.customId === customId) || null;
