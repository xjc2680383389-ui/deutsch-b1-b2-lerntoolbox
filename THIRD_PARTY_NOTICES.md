# 第三方算法来源与许可

`js/core/dhp.js` 与 `scripts/build_ssp_policy.js` 的 DHP-HLR 公式、拟合参数和 SSP-MMC 求解思路移植自 [MaiMemo/SSP-MMC-Plus](https://github.com/maimemo/SSP-MMC-Plus)，参考提交 `b20a49f2f7403c5013b0c9f0937d5296a7b50fd6` 的 `SSP-MMC/DHP.cpp`。
生成的 `js/data/ssp_policy.js` 是上述离散值迭代的输出。上游为研究复现代码，最近推送日期核验为 2024-03-14，采用 MIT 许可；它不是现成的浏览器调度库。本项目以 JavaScript 移植算法，避免引入 C++、Python、PyTorch 等运行时依赖；同日重练、旧进度迁移及更严格的收敛检查为本地适配，详见 README。

相关论文：

- Ye, Su, Cao (2022). *A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling*. DOI: [10.1145/3534678.3539081](https://doi.org/10.1145/3534678.3539081)，对应原版 [SSP-MMC](https://github.com/maimemo/SSP-MMC)。
- Su et al. (2023). *Optimizing Spaced Repetition Schedule by Capturing the Dynamics of Memory*. DOI: [10.1109/TKDE.2023.3251721](https://doi.org/10.1109/TKDE.2023.3251721)。本实现采用该扩展版的 DHP-HLR 分支，未使用 GRU-HLR。
- 复现数据 DOI：[10.7910/DVN/VAGUL0](https://doi.org/10.7910/DVN/VAGUL0)。`.ris` 文件为引用元数据，不是数据集。学习日志未纳入本仓库，也未重新训练参数。

以下为上游许可原文：

MIT License

Copyright (c) 2022 MaiMemo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
