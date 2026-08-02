import { Discussion, Note } from '@/types';

export const discussions: Discussion[] = [
  {
    id: 'd-001',
    title: '常识判断部分地理题怎么复习？',
    content: '最近刷常识判断题发现地理类题目错误率很高，有没有大佬分享一下复习方法？特别是中国地理和世界地理的区分...',
    author: '学海无涯',
    replies: [
      { id: 'r-001', content: '建议先梳理中国地理的基本框架：地形、气候、河流三大板块。', author: '地理达人', createdAt: '2024-03-15' },
      { id: 'r-002', content: '推荐画思维导图，把每个省份的特色资源标记出来。', author: '思维导图爱好者', createdAt: '2024-03-16' },
    ],
    likes: 42,
    createdAt: '2024-03-14',
  },
  {
    id: 'd-002',
    title: '逻辑推理题的秒杀技巧分享',
    content: '总结了几种常见逻辑推理题型的快速解法，包括假设法、排除法和代入法，希望对大家有帮助...',
    author: '逻辑小王子',
    replies: [
      { id: 'r-003', content: '太实用了！假设法那块讲得很清楚。', author: '备考中的小明', createdAt: '2024-03-18' },
    ],
    likes: 89,
    createdAt: '2024-03-17',
  },
  {
    id: 'd-003',
    title: '数量关系真的可以放弃吗？',
    content: '很多学长说数量关系太难可以放弃，但我感觉有些题目还是有规律的，想听听大家的看法...',
    author: '不放弃的小蜗牛',
    replies: [
      { id: 'r-004', content: '不建议完全放弃，至少掌握工程问题和行程问题这两种高频题型。', author: '过来人', createdAt: '2024-03-20' },
      { id: 'r-005', content: '数量关系确实难，但拿6-7题的正确率还是可以做到的。', author: '数学老师', createdAt: '2024-03-21' },
      { id: 'r-006', content: '我觉得关键是时间管理，先做简单的，难的猜答案。', author: '时间管理大师', createdAt: '2024-03-22' },
    ],
    likes: 67,
    createdAt: '2024-03-19',
  },
  {
    id: 'd-004',
    title: '言语理解：如何区分近义词？',
    content: '言语理解的词语辨析部分总是分不清，比如"启用"和"起用"，"截止"和"截至"这些易混词，有什么好的记忆方法吗？',
    author: '词语苦手',
    replies: [
      { id: 'r-007', content: '多做真题，在语境中记忆比死记硬背效果好很多。', author: '真题狂人', createdAt: '2024-03-25' },
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
    questionId: 'cs-001',
    content: '中国五大淡水湖的记忆口诀：鄱洞太洪巢（鄱阳、洞庭、太湖、洪泽、巢湖），可以谐音记忆"破洞太红潮"。',
    author: '记忆大师',
    isPublic: true,
    createdAt: '2024-03-10',
  },
  {
    id: 'n-002',
    questionId: 'lr-003',
    content: '命题逻辑四种形式记忆：原命题P→Q，逆命题Q→P，否命题¬P→¬Q，逆否命题¬Q→¬P。只有逆否命题和原命题等价！',
    author: '逻辑达人',
    isPublic: true,
    createdAt: '2024-03-12',
  },
  {
    id: 'n-003',
    questionId: 'sl-003',
    content: '先涨a%再降a%，最终亏损a²/100 %。这个公式要记住，是数量关系的高频考点！',
    author: '数学笔记',
    isPublic: true,
    createdAt: '2024-03-15',
  },
  {
    id: 'n-004',
    questionId: 'yr-002',
    content: '破釜沉舟 vs 孤注一掷 vs 背水一战：三者都表示决心很大，但侧重点不同。破釜沉舟强调主动断绝退路，孤注一掷强调冒险一搏，背水一战强调被动无路可退。',
    author: '词语辨析笔记',
    isPublic: true,
    createdAt: '2024-03-18',
  },
];
