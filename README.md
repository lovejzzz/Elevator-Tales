# Elevator Tales

![Elevator Tales](public/assets/elevator-cabin.png)

一款发生在午夜电梯里的无尽乘客编排游戏。把乘客放入六个位置，利用人物之间的协作与冲突，在电量耗尽或躁动失控前尽可能抵达更高楼层。

[在线游玩](https://lovejzzz.github.io/Elevator-Tales/) · [稳定公开版](https://elevator-tales-midnight.skylab.chatgpt.site/) · [更新日志](CHANGELOG.md)

## 核心玩法

- 每层会出现三名候选乘客，玩家决定谁上车，以及站在哪里。
- 每位乘客有三项核心数值：到站金币、每层耗电、每层躁动。
- 相邻人物可能产生协作或冲突；同类效果可以堆叠。
- 玩家可以提前赶客，但会失去其到站收益并支付赔偿。
- 每十层进入一次商店，用本班赚到的金币充电或购买升级。
- 游戏没有终点。楼层越高，资源越紧，躁动压力越强。

## 操作

- 点击候选乘客，再点击空位让其上车。
- 桌面端可直接拖拽乘客到位置；车内乘客也可换位。
- 手机端使用上方乘客卡与下方电梯，不需要滚动页面。
- 点击已上车乘客可以查看或执行赶客。
- 安排完成后点击“关门上行”。

建议第一次从带教学的地址开始：

<https://lovejzzz.github.io/Elevator-Tales/?tutorial=1>

## 设计目标

游戏追求的是“勉强能过、举步维艰”的生存感。单纯追逐金币、忽略躁动或囤积资源都不是稳定解；真正的决策来自乘客组合、位置关系、短期风险与下一次补给之间的取舍。

当前平衡检查会覆盖规则不变量、人物联动、堆叠、预测一致性、音效反馈与大量自动对局。每次公开更新都必须同步记录实验规模、具体数值变化、结论和仍需观察的问题。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

常用检查：

```bash
npm run verify
npm run simulate -- 5000
npm run build
```

## 发布

推送到 `main` 后，GitHub Actions 会先运行完整规则检查，再生成静态版本并部署到 GitHub Pages。

GitHub Pages 使用仓库子路径 `/Elevator-Tales/`；普通构建仍保持原有服务器发布方式，两种发布不会互相影响。

## 项目结构

- `components/elevator-game.tsx`：主要游戏界面与交互
- `lib/game-engine.ts`：回合推进、结算和失败条件
- `lib/game-data.ts`：乘客与升级数据
- `lib/game-interaction.ts`：人物协作、冲突与堆叠
- `scripts/`：规则验证、平衡模拟和回归测试
- `CHANGELOG.md`：每个公开版本的实验与改进记录

## 状态

当前版本仍处于持续平衡与体验打磨阶段。欢迎在 Issues 中记录到达楼层、失败原因、难以理解的角色描述或显示问题；这些信息会直接用于下一轮测试。
