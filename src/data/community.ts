import { Discussion, Note } from '@/types';

export const discussions: Discussion[] = [
  {
    id: 'd-001',
    title: '教育学「教育与社会」这部分怎么复习？',
    content: '最近刷教育学题发现「教育与社会」这一章错误率很高，有没有大佬分享一下复习方法？特别是教育与社会关系的几个核心考点的区分...',
    author: '学海无涯',
    replies: [
      { id: 'r-001', content: '建议先梳理教育与社会关系的基本框架：教育的社会属性、教育与生产力、政治经济制度、文化的相互关系四大板块。', author: '地理达人', createdAt: '2024-03-15' },
      { id: 'r-002', content: '推荐画思维导图，把每个考点的关键人物、著作、年份标记出来。', author: '思维导图爱好者', createdAt: '2024-03-16' },
    ],
    likes: 42,
    createdAt: '2024-03-14',
  },
  {
    id: 'd-002',
    title: '教育学多选题的判断技巧分享',
    content: '总结了几种多选题的判断技巧：先排除明显错误项，再比对教材原文表述，能拿不少分...',
    author: '上岸小李',
    replies: [
      { id: 'r-003', content: '太实用了！排除法那块讲得很清楚。', author: '备考中的小明', createdAt: '2024-03-18' },
    ],
    likes: 89,
    createdAt: '2024-03-17',
  },
  {
    id: 'd-003',
    title: '判断题真的可以靠常识吗？',
    content: '教育学判断题感觉只差一个词，但每次都在这上面栽跟头，想听听大家的判断方法...',
    author: '不放弃的小蜗牛',
    replies: [
      { id: 'r-004', content: '别背结论，去教材里找对应原句，改一个词就反了。', author: '过来人', createdAt: '2024-03-20' },
      { id: 'r-005', content: '判断题确实细节多，但把高频考点过一遍正确率能到八成。', author: '张老师', createdAt: '2024-03-21' },
      { id: 'r-006', content: '我觉得关键是时间管理，先做有把握的，难的标记回头再看。', author: '时间管理大师', createdAt: '2024-03-22' },
    ],
    likes: 67,
    createdAt: '2024-03-19',
  },
  {
    id: 'd-004',
    title: '教育学人物观点总是记混怎么办？',
    content: '夸美纽斯、赫尔巴特、杜威、陶行知的观点老是张冠李戴，有什么好的记忆方法吗？',
    author: '背诵苦手',
    replies: [
      { id: 'r-007', content: '按"时代+核心主张"做表格对比，一眼就分清了。', author: '真题狂人', createdAt: '2024-03-25' },
    ],
    likes: 35,
    createdAt: '2024-03-24',
  },
  {
    id: 'd-005',
    title: '连续打卡30天分享我的备考心得',
    content: '从最初的每天10题到现在的每天30题，坚持了一个月感觉收获很大。分享一下我的学习规划和时间分配...',
    author: '坚持就是胜利',
    replies: [
      { id: 'r-008', content: '恭喜！坚持就是最大的胜利！请问你是每天固定时间刷题吗？', author: '新来的小伙伴', createdAt: '2024-03-28' },
      { id: 'r-009', content: '太励志了！我也要从今天开始打卡！', author: '被激励的学渣', createdAt: '2024-03-29' },
    ],
    likes: 128,
    createdAt: '2024-03-27',
  },
];

export const publicNotes: Note[] = [
  {
    id: 'n-001',
    questionId: 'edu-c0s1-s1',
    content: '中国五大淡水湖的记忆口诀：鄱洞太洪巢（鄱阳、洞庭、太湖、洪泽、巢湖），可以谐音记忆"破洞太红潮"。',
    author: '记忆大师',
    isPublic: true,
    createdAt: '2024-03-10',
  },
  {
    id: 'n-002',
    questionId: 'edu-c0s2-s1',
    content: '命题逻辑四种形式记忆：原命题P→Q，逆命题Q→P，否命题¬P→¬Q，逆否命题¬Q→¬P。只有逆否命题和原命题等价！',
    author: '逻辑达人',
    isPublic: true,
    createdAt: '2024-03-12',
  },
  {
    id: 'n-003',
    questionId: 'edu-c0s3-s1',
    content: '夸美纽斯提出“泛智教育”，主张把一切知识教给一切人——这个考点要记住，是教育学高频考点！',
    author: '数学笔记',
    isPublic: true,
    createdAt: '2024-03-15',
  },
  {
    id: 'n-004',
    questionId: 'edu-c0s4-s1',
    content: '破釜沉舟 vs 孤注一掷 vs 背水一战：三者都表示决心很大，但侧重点不同。破釜沉舟强调主动断绝退路，孤注一掷强调冒险一搏，背水一战强调被动无路可退。',
    author: '词语辨析笔记',
    isPublic: true,
    createdAt: '2024-03-18',
  },
];
