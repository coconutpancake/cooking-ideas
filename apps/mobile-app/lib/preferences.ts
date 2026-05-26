export const defaultGoalOptions = ['认真吃好每一顿', '轻盈减脂', '清淡养生', '高蛋白增肌'];
export const defaultTasteOptions = ['清淡鲜美', '经典下饭', '咸甜交织', '无辣不欢', '酸甜开胃', '轻食西餐'];
export const defaultAvoidanceOptions = ['不吃香菜', '不吃葱'];

const currentDefaultOptions = new Set([
  ...defaultGoalOptions,
  ...defaultTasteOptions,
  ...defaultAvoidanceOptions,
]);

const obsoleteDefaultOptions = new Set([
  '日常好好吃饭',
  '减脂瘦身',
  '增肌吃肉',
  '重口下饭',
  '偏爱西餐',
  '乐于尝试',
  '中式小炒',
  '不吃蒜',
  '少吃辣',
]);

export function mergeOptions(defaults: string[], selected: string[]) {
  return Array.from(new Set([...defaults, ...selected]));
}

export function keepCurrentOrCustomOptions(values?: string[]) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter((value) => value && (currentDefaultOptions.has(value) || !obsoleteDefaultOptions.has(value))),
    ),
  );
}
