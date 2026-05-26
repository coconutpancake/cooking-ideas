const substantialIngredients = [
  '猪肉',
  '肉丝',
  '肉片',
  '肉末',
  '五花肉',
  '里脊肉',
  '牛肉',
  '羊肉',
  '鸡肉',
  '鸡胸肉',
  '鸡腿肉',
  '鸡蛋',
  '鸭蛋',
  '鹌鹑蛋',
  '豆腐',
  '黄瓜',
  '丝瓜',
  '冬瓜',
  '苦瓜',
  '南瓜',
  '胡萝卜',
  '土豆',
  '玉米',
  '西兰花',
  '洋葱',
  '青椒',
  '茄子',
  '番茄',
  '西红柿',
  '蘑菇',
  '木耳',
  '香菇',
  '金针菇',
  '苹果',
  '面粉',
  '糯米粉',
  '米饭',
  '面条',
  '意大利面',
  '意面',
  '意粉',
  '通心粉',
];

const seasoningAmounts: Array<[RegExp, string]> = [
  [/盐/, '1小勺'],
  [/糖/, '半小勺'],
  [/胡椒粉|五香粉|孜然粉|辣椒粉/, '少许'],
  [/生抽|酱油|料酒|蚝油|醋/, '1汤勺'],
  [/老抽/, '半汤勺'],
  [/淀粉/, '1小勺'],
  [/番茄酱|豆瓣酱|黄豆酱|甜面酱/, '1汤勺'],
  [/葱花|葱/, '1小把'],
  [/姜|蒜/, '2-3片/瓣'],
  [/油|食用油|香油/, '1汤勺'],
  [/水|清水|高汤/, '半碗'],
];

const seasoningNamePatterns = [
  /酱$/,
  /酱油$/,
  /汁$/,
  /油$/,
  /粉$/,
  /醋$/,
  /酒$/,
  /料酒$/,
  /盐$/,
  /糖$/,
  /胡椒$/,
  /水$/,
  /高汤$/,
  /番茄酱/,
  /豆瓣酱/,
  /黄豆酱/,
  /甜面酱/,
  /蚝油/,
  /生抽/,
  /老抽/,
  /淀粉/,
  /辣椒粉/,
  /五香粉/,
  /孜然粉/,
];

const mainIngredientAmounts: Array<[RegExp, string]> = [
  [/鸡蛋|鸭蛋/, '2个'],
  [/鹌鹑蛋/, '6个'],
  [/黄瓜|丝瓜|苦瓜|茄子|玉米/, '1根'],
  [/胡萝卜|洋葱|青椒|彩椒|土豆|番茄|西红柿/, '半个'],
  [/南瓜|冬瓜/, '200克'],
  [/西兰花|花菜|蘑菇|香菇|金针菇/, '150克'],
  [/木耳/, '一小把'],
  [/豆腐/, '半块'],
  [/猪肉|肉丝|肉片|肉末|五花肉|里脊肉|牛肉|羊肉|鸡肉|鸡胸肉|鸡腿肉/, '150克'],
  [/虾|虾仁/, '150克'],
  [/鱼/, '250克'],
  [/苹果/, '1个'],
  [/面粉|糯米粉|米饭|面条|意大利面|意面|意粉|通心粉/, '150克'],
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function isSeasoningIngredient(name: string) {
  const normalized = normalize(name);
  return seasoningNamePatterns.some((pattern) => pattern.test(normalized));
}

export function isSubstantialIngredient(name: string) {
  const normalized = normalize(name);
  if (isSeasoningIngredient(normalized)) {
    return false;
  }

  return substantialIngredients.some((item) => normalized.includes(normalize(item)));
}

export function classifyRecipeIngredients(mainIngredients: string[], seasonings: string[]) {
  const normalizedMain = new Set(mainIngredients.map(normalize));
  const nextMain: string[] = [];
  const nextSeasonings: string[] = [];

  for (const ingredient of mainIngredients) {
    const normalized = normalize(ingredient);
    if (isSeasoningIngredient(ingredient)) {
      if (!nextSeasonings.some((item) => normalize(item) === normalized)) {
        nextSeasonings.push(ingredient);
      }
      continue;
    }

    if (!nextMain.some((item) => normalize(item) === normalized)) {
      nextMain.push(ingredient);
    }
  }

  for (const seasoning of seasonings) {
    const normalized = normalize(seasoning);
    if (isSeasoningIngredient(seasoning)) {
      if (!nextSeasonings.some((item) => normalize(item) === normalized)) {
        nextSeasonings.push(seasoning);
      }
    } else if (isSubstantialIngredient(seasoning) && !normalizedMain.has(normalized)) {
      nextMain.push(seasoning);
      normalizedMain.add(normalized);
    } else {
      nextSeasonings.push(seasoning);
    }
  }

  return {
    mainIngredients: nextMain,
    seasonings: nextSeasonings,
  };
}

export function estimateMainIngredientAmount(name: string) {
  if (isSeasoningIngredient(name)) {
    return estimateSeasoningAmount(name);
  }

  return mainIngredientAmounts.find(([pattern]) => pattern.test(name))?.[1] ?? '约100克';
}

export function estimateSeasoningAmount(name: string) {
  return seasoningAmounts.find(([pattern]) => pattern.test(name))?.[1] ?? '适量';
}
