import type { CodeSnippet, ProgramBlock } from './types';
import { v4 as uuidv4 } from 'uuid';

type ProgramBlockNoId = {
  type: ProgramBlock['type'];
  children?: ProgramBlockNoId[];
  repeatCount?: number;
  functionId?: string;
};

function makeBlocks(blocks: ProgramBlockNoId[]): ProgramBlock[] {
  return blocks.map((b) => ({
    ...b,
    id: uuidv4(),
    children: b.children ? makeBlocks(b.children) : undefined,
  }));
}

export const BUILTIN_SNIPPETS: CodeSnippet[] = [
  {
    id: 'builtin-square',
    name: '走正方形',
    description: '使用循环让机器人走出一个正方形路径',
    explanation:
      '正方形的四条边长度相等，每次转弯角度都是90度。\n\n核心思路：\n1. 观察到正方形 = 重复4次"前进N步 + 右转"\n2. 使用循环(4次)包裹这两个指令\n3. 调整前进步数可以控制正方形大小\n\n进阶思考：如果要走长方形怎么办？可以定义两个函数分别处理长边和短边。',
    category: 'movement',
    difficulty: 2,
    program: {
      main: makeBlocks([
        {
          type: 'loop',
          repeatCount: 4,
          children: [
            { type: 'move' },
            { type: 'move' },
            { type: 'move' },
            { type: 'turnRight' },
          ],
        },
      ]),
      functions: {},
    },
    tags: ['循环', '基础', '几何'],
    isBuiltin: true,
  },
  {
    id: 'builtin-spiral',
    name: '螺旋搜索',
    description: '由外向内螺旋式遍历，用于搜索整个区域',
    explanation:
      '螺旋搜索是一种从外围向中心逐步收缩的遍历策略。\n\n核心思路：\n1. 每走两圈边长就减少1步（向右走N步、向下走N步、向左走N-1步、向上走N-1步...）\n2. 可以用多个循环嵌套，或用函数封装"走一条边"的逻辑\n3. 适用于需要全覆盖搜索的场景\n\n适用场景：\n- 在未知区域内搜索目标\n- 按顺序收集网格中的所有物品',
    category: 'search',
    difficulty: 4,
    program: {
      main: makeBlocks([
        {
          type: 'loop',
          repeatCount: 4,
          children: [
            { type: 'move' },
            { type: 'move' },
            { type: 'move' },
            { type: 'move' },
            { type: 'turnRight' },
          ],
        },
        {
          type: 'loop',
          repeatCount: 4,
          children: [
            { type: 'move' },
            { type: 'move' },
            { type: 'turnRight' },
          ],
        },
      ]),
      functions: {},
    },
    tags: ['搜索', '循环', '遍历'],
    isBuiltin: true,
  },
  {
    id: 'builtin-wallfollower',
    name: '右手规则迷宫',
    description: '经典迷宫解法：始终扶着右边的墙走',
    explanation:
      '右手规则（也叫右手法则）是解迷宫的经典算法。\n\n核心思路：\n1. 尽可能向右转并前进\n2. 如果右边有墙，尝试直走\n3. 如果前方也有墙，就左转（重新评估）\n\n程序结构：\n- 外层大循环：重复执行探索逻辑\n- 如果前方是墙 → 左转（试探另一个方向）\n- 否则 → 前进\n\n注意：本游戏中条件块只有"如果前方是墙"，没有"如果右边是墙"，所以采用简化版：遇墙就右转。',
    category: 'maze',
    difficulty: 4,
    program: {
      main: makeBlocks([
        {
          type: 'loop',
          repeatCount: 20,
          children: [
            {
              type: 'ifWall',
              children: [{ type: 'turnRight' }],
            },
            {
              type: 'ifEmpty',
              children: [{ type: 'move' }],
            },
          ],
        },
      ]),
      functions: {},
    },
    tags: ['迷宫', '条件判断', '算法'],
    isBuiltin: true,
  },
  {
    id: 'builtin-zigzag',
    name: '蛇形扫描',
    description: '像蛇一样左右蜿蜒前进，逐行扫描',
    explanation:
      '蛇形扫描（也叫之字形扫描）是逐行遍历的高效方式。\n\n核心思路：\n1. 第1行：从左走到右\n2. 走到头后转弯向下一格，再转回来\n3. 第2行：从右走到左\n4. 如此交替，覆盖所有行\n\n实现技巧：\n- 可以定义函数来处理"一行"的逻辑\n- 每行结束时用两次转弯实现"掉头"\n- 适用场景：棋盘形区域全覆盖、按行收集物品',
    category: 'pattern',
    difficulty: 5,
    program: {
      main: makeBlocks([
        {
          type: 'function',
          functionId: 'row',
          children: [
            { type: 'move' },
            { type: 'move' },
            { type: 'move' },
            { type: 'move' },
            { type: 'move' },
            { type: 'move' },
            { type: 'turnRight' },
            { type: 'move' },
            { type: 'turnRight' },
          ],
        },
        { type: 'callFunction', functionId: 'row' },
        { type: 'callFunction', functionId: 'row' },
      ]),
      functions: {},
    },
    tags: ['遍历', '函数', '模式'],
    isBuiltin: true,
  },
  {
    id: 'builtin-staircase',
    name: '阶梯形前进',
    description: '对角线方向前进：前进一步、右转、前进一步、左转',
    explanation:
      '阶梯形模式可以让机器人沿着对角线方向移动。\n\n核心思路：\n每一次"阶梯"包含：\n1. 前进1步 → 向右平移1格\n2. 右转 → 朝向改变\n3. 前进1步 → 向下平移1格\n4. 左转 → 恢复原朝向\n\n这样整体效果就是向右下对角线方向移动。\n\n把这4步放进循环里，就能连续走阶梯了！',
    category: 'movement',
    difficulty: 3,
    program: {
      main: makeBlocks([
        {
          type: 'loop',
          repeatCount: 4,
          children: [
            { type: 'move' },
            { type: 'turnRight' },
            { type: 'move' },
            { type: 'turnLeft' },
          ],
        },
      ]),
      functions: {},
    },
    tags: ['循环', '移动', '几何'],
    isBuiltin: true,
  },
  {
    id: 'builtin-bypasswall',
    name: '绕墙走',
    description: '当遇到墙壁时，从上方或下方绕过障碍',
    explanation:
      '绕墙策略用于处理前进道路上的单个障碍物。\n\n核心思路（以上绕为例）：\n1. 检测到前方有墙时：\n   - 左转 → 朝上\n   - 前进1步 → 移到墙的上方\n   - 右转 → 恢复朝右\n   - 前进1步 → 越过墙\n   - 右转 → 朝下\n   - 前进1步 → 回到原行\n   - 左转 → 恢复朝右\n2. 如果没墙就直接前进\n\n注意：需要根据墙的高度调整绕路的步数。',
    category: 'maze',
    difficulty: 3,
    program: {
      main: makeBlocks([
        {
          type: 'loop',
          repeatCount: 10,
          children: [
            {
              type: 'ifWall',
              children: [
                { type: 'turnLeft' },
                { type: 'move' },
                { type: 'turnRight' },
                { type: 'move' },
                { type: 'turnRight' },
                { type: 'move' },
                { type: 'turnLeft' },
              ],
            },
            {
              type: 'ifEmpty',
              children: [{ type: 'move' }],
            },
          ],
        },
      ]),
      functions: {},
    },
    tags: ['障碍', '条件判断', '移动'],
    isBuiltin: true,
  },
  {
    id: 'basic-straight',
    name: '直线前进',
    description: '最基础的模式：使用循环让机器人连续前进',
    explanation:
      '直线前进是所有复杂路径的基础。\n\n核心思路：\n- 需要走N步时，与其重复写N个"前进"，不如用循环(N次)包裹1个前进\n- 代码更简洁，也更容易修改步数\n\n例如：循环(6次) { 前进 } = 前进6步\n\n这是"DRY原则"（Don\'t Repeat Yourself）的最简单体现。',
    category: 'movement',
    difficulty: 1,
    program: {
      main: makeBlocks([
        {
          type: 'loop',
          repeatCount: 5,
          children: [{ type: 'move' }],
        },
      ]),
      functions: {},
    },
    tags: ['基础', '循环'],
    isBuiltin: true,
  },
  {
    id: 'builtin-collectstar',
    name: '条件收集星星',
    description: '检测前方是否有星星，有就走过去收集',
    explanation:
      '利用条件判断进行智能收集。\n\n核心思路：\n1. 循环检查前方状态\n2. 如果前方有星星 → 前进收集\n3. 如果前方是空地也可以前进\n4. 如果是墙则转弯\n\n组合使用多个条件块，可以让机器人做出更复杂的决策。\n\n进阶：可以把"收集+继续"封装成函数，让主程序更清晰。',
    category: 'pattern',
    difficulty: 4,
    program: {
      main: makeBlocks([
        {
          type: 'loop',
          repeatCount: 15,
          children: [
            {
              type: 'ifStar',
              children: [{ type: 'move' }],
            },
            {
              type: 'ifEmpty',
              children: [{ type: 'move' }],
            },
            {
              type: 'ifWall',
              children: [{ type: 'turnRight' }],
            },
          ],
        },
      ]),
      functions: {},
    },
    tags: ['星星', '条件判断', '收集'],
    isBuiltin: true,
  },
];

export const SNIPPET_CATEGORIES: Record<CodeSnippet['category'], string> = {
  movement: '🚶 移动模式',
  search: '🔍 搜索策略',
  maze: '🧩 迷宫探索',
  pattern: '✨ 经典模式',
  custom: '📂 我的收藏',
};
