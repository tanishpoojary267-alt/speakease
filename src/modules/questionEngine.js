// ========================================
// Speakease — Question Engine v2
// 80+ questions per field, shuffled on every session
// Fields: software, marketing, finance, datascience, hr_general
// ========================================

const questionBank = {

    // ══════════════════════════════════════════════
    // SOFTWARE ENGINEERING / CS — 80 questions
    // ══════════════════════════════════════════════
    software: [
        // Technical — Core CS
        { q: "What programming languages are you most comfortable with, and why?", type: "technical" },
        { q: "Explain object-oriented programming and its four pillars.", type: "technical" },
        { q: "What is the difference between a stack and a queue?", type: "technical" },
        { q: "How does HTTP work? What is the difference between GET and POST?", type: "technical" },
        { q: "What is version control and why is Git important?", type: "technical" },
        { q: "What is an API and how have you used one?", type: "technical" },
        { q: "What is the difference between SQL and NoSQL databases?", type: "technical" },
        { q: "What is responsive design and how do you implement it?", type: "technical" },
        { q: "Explain the concept of time complexity with a Big-O example.", type: "technical" },
        { q: "What is the difference between compiled and interpreted languages?", type: "technical" },
        { q: "Explain what recursion is with a simple example.", type: "technical" },
        { q: "What is a binary search tree and how does it work?", type: "technical" },
        { q: "Explain the MVC design pattern.", type: "technical" },
        { q: "What is the difference between synchronous and asynchronous code?", type: "technical" },
        { q: "What is a RESTful API? What are its key principles?", type: "technical" },
        { q: "What is the difference between TCP and UDP?", type: "technical" },
        { q: "Explain what a database index is and why it matters.", type: "technical" },
        { q: "What is cache and how does caching improve performance?", type: "technical" },
        { q: "What is Docker and why would you use it?", type: "technical" },
        { q: "Explain what CI/CD means in software development.", type: "technical" },
        { q: "What is the difference between authentication and authorization?", type: "technical" },
        { q: "What are microservices and when would you use them?", type: "technical" },
        { q: "Explain what agile methodology is.", type: "technical" },
        { q: "What is the difference between unit testing and integration testing?", type: "technical" },
        { q: "What is a promise in JavaScript?", type: "technical" },
        { q: "What is the difference between == and === in JavaScript?", type: "technical" },
        { q: "Explain how the DOM works in a browser.", type: "technical" },
        { q: "What is a foreign key in a relational database?", type: "technical" },
        { q: "What is the difference between a process and a thread?", type: "technical" },
        { q: "What is a memory leak and how do you prevent it?", type: "technical" },
        { q: "Explain what polymorphism means with a real-world example.", type: "technical" },
        { q: "What is encapsulation and why is it important?", type: "technical" },
        { q: "What is a design pattern? Name three you have used.", type: "technical" },
        { q: "What is the singleton pattern and when would you use it?", type: "technical" },
        { q: "What is dependency injection?", type: "technical" },
        { q: "Explain deadlock in operating systems.", type: "technical" },
        { q: "What is a hash table and what is it used for?", type: "technical" },
        { q: "What is the difference between a linked list and an array?", type: "technical" },
        { q: "What is a graph data structure and name two real-world uses.", type: "technical" },
        { q: "What is the difference between depth-first and breadth-first search?", type: "technical" },
        // Behavioral
        { q: "Tell me about yourself and why you chose software engineering.", type: "behavioral" },
        { q: "Describe a project you are most proud of.", type: "behavioral" },
        { q: "How do you handle tight deadlines?", type: "behavioral" },
        { q: "Tell me about a time you worked in a team and there was conflict.", type: "behavioral" },
        { q: "Where do you see yourself in 5 years?", type: "behavioral" },
        { q: "How do you stay updated with new technologies?", type: "behavioral" },
        { q: "Describe a time you failed at something technical.", type: "behavioral" },
        { q: "How do you prioritize tasks when everything seems urgent?", type: "behavioral" },
        { q: "Tell me about a time you went above and beyond in a project.", type: "behavioral" },
        { q: "How do you handle receiving negative feedback on your code?", type: "behavioral" },
        { q: "Describe the most challenging bug you ever fixed.", type: "behavioral" },
        { q: "Tell me about a time you had to learn something completely new quickly.", type: "behavioral" },
        { q: "Describe a situation where you disagreed with a technical decision.", type: "behavioral" },
        { q: "How do you approach debugging a difficult problem?", type: "behavioral" },
        { q: "Tell me about a time you improved a process or codebase.", type: "behavioral" },
        { q: "How do you balance writing clean code with meeting deadlines?", type: "behavioral" },
        { q: "Describe a time you had to explain a technical concept to a non-technical person.", type: "behavioral" },
        { q: "How do you handle working under a manager you disagree with?", type: "behavioral" },
        { q: "Tell me about a time you collaborated with a cross-functional team.", type: "behavioral" },
        { q: "How do you keep yourself motivated during repetitive or tedious tasks?", type: "behavioral" },
        // HR
        { q: "What are your strengths and weaknesses?", type: "hr" },
        { q: "Why should we hire you?", type: "hr" },
        { q: "What are your salary expectations?", type: "hr" },
        { q: "Why are you interested in this role?", type: "hr" },
        { q: "What do you know about our company?", type: "hr" },
        { q: "How do you handle work-life balance?", type: "hr" },
        { q: "Do you prefer working independently or in a team?", type: "hr" },
        { q: "Describe your ideal work environment.", type: "hr" },
        { q: "What motivates you in your work?", type: "hr" },
        { q: "What is your greatest professional achievement?", type: "hr" },
        { q: "Where do you see yourself in 10 years?", type: "hr" },
        { q: "How do you handle stress and pressure at work?", type: "hr" },
        { q: "What is your management style preference?", type: "hr" },
        { q: "Why are you leaving your current position?", type: "hr" },
        { q: "What are your long-term career goals?", type: "hr" },
        { q: "How do you approach continuous self-improvement?", type: "hr" },
        { q: "What makes you unique compared to other candidates?", type: "hr" },
        { q: "How do you handle failure and bounce back?", type: "hr" },
        { q: "Tell me about a time you showed leadership without being asked.", type: "hr" },
        { q: "Do you have any questions for me about the role or company?", type: "hr" },
    ],

    // ══════════════════════════════════════════════
    // MARKETING — 80 questions
    // ══════════════════════════════════════════════
    marketing: [
        // Technical
        { q: "What digital marketing channels are you most familiar with?", type: "technical" },
        { q: "How would you measure the success of a marketing campaign?", type: "technical" },
        { q: "Explain SEO basics and why it matters for a business.", type: "technical" },
        { q: "What is the difference between organic and paid marketing?", type: "technical" },
        { q: "How do you create a buyer persona?", type: "technical" },
        { q: "What content marketing strategies do you recommend for brand awareness?", type: "technical" },
        { q: "Explain A/B testing and how you would use it.", type: "technical" },
        { q: "Which social media platforms would you focus on for a B2B company?", type: "technical" },
        { q: "What is a conversion funnel and how do you optimize it?", type: "technical" },
        { q: "Explain the concept of customer lifetime value (CLV).", type: "technical" },
        { q: "What is email marketing and how do you improve open rates?", type: "technical" },
        { q: "What is Google Analytics and what metrics do you track?", type: "technical" },
        { q: "Explain the difference between CPM, CPC, and CPA.", type: "technical" },
        { q: "What is influencer marketing and when would you use it?", type: "technical" },
        { q: "What is remarketing and how does it work?", type: "technical" },
        { q: "Explain what a USP (Unique Selling Proposition) is.", type: "technical" },
        { q: "What is brand positioning and why does it matter?", type: "technical" },
        { q: "How would you approach a product launch campaign with a small budget?", type: "technical" },
        { q: "What is marketing automation and what tools have you used?", type: "technical" },
        { q: "Explain what SEM (Search Engine Marketing) is.", type: "technical" },
        { q: "What is customer segmentation and how do you do it?", type: "technical" },
        { q: "What are KPIs in marketing and how do you set them?", type: "technical" },
        { q: "What is native advertising and how is it different from display ads?", type: "technical" },
        { q: "Explain the 4Ps of marketing.", type: "technical" },
        { q: "What is viral marketing and what makes content go viral?", type: "technical" },
        { q: "What is affiliate marketing?", type: "technical" },
        { q: "How would you calculate the ROI of a marketing campaign?", type: "technical" },
        { q: "What is a CRM and how does it help marketing?", type: "technical" },
        { q: "What is the difference between B2B and B2C marketing?", type: "technical" },
        { q: "What is growth hacking?", type: "technical" },
        { q: "How do you approach keyword research for SEO?", type: "technical" },
        { q: "What is a landing page and what makes a great one?", type: "technical" },
        { q: "What is a marketing funnel?", type: "technical" },
        { q: "How would you build a social media strategy from scratch?", type: "technical" },
        { q: "What is content repurposing and why is it useful?", type: "technical" },
        { q: "How do you stay updated with marketing trends and algorithm changes?", type: "technical" },
        { q: "What is programmatic advertising?", type: "technical" },
        { q: "Explain what public relations (PR) is and how it differs from advertising.", type: "technical" },
        { q: "How would you handle a negative viral moment for a brand on social media?", type: "technical" },
        { q: "What is a marketing audit?", type: "technical" },
        // Behavioral
        { q: "Tell me about a creative campaign idea you have worked on.", type: "behavioral" },
        { q: "Describe a time a campaign failed. What did you learn?", type: "behavioral" },
        { q: "Tell me about a time you used data to change a marketing strategy.", type: "behavioral" },
        { q: "How do you handle a campaign that is underperforming?", type: "behavioral" },
        { q: "Describe a time you collaborated with the sales team.", type: "behavioral" },
        { q: "Tell me about a time you worked with a very limited budget.", type: "behavioral" },
        { q: "How do you handle creative disagreements with stakeholders?", type: "behavioral" },
        { q: "Describe your most successful campaign and why it worked.", type: "behavioral" },
        { q: "Tell me about a time you had to adapt your strategy mid-campaign.", type: "behavioral" },
        { q: "How do you handle the pressure of hitting quarterly targets?", type: "behavioral" },
        // HR
        { q: "Why did you choose marketing as a career?", type: "hr" },
        { q: "What brands do you admire and why?", type: "hr" },
        { q: "What are your strengths as a marketer?", type: "hr" },
        { q: "Where do you see yourself in 5 years in your marketing career?", type: "hr" },
        { q: "Why should we hire you over other marketing candidates?", type: "hr" },
        { q: "What are your salary expectations?", type: "hr" },
        { q: "How do you handle working under tight deadlines?", type: "hr" },
        { q: "Describe your ideal work environment.", type: "hr" },
        { q: "What motivates you in a marketing role?", type: "hr" },
        { q: "Tell me about your greatest career achievement in marketing.", type: "hr" },
        { q: "How do you balance creativity with data-driven decisions?", type: "hr" },
        { q: "What is your approach to continuous learning in marketing?", type: "hr" },
        { q: "How do you stay inspired creatively?", type: "hr" },
        { q: "What do you consider your biggest weakness in marketing?", type: "hr" },
        { q: "What would your previous manager say about your marketing skills?", type: "hr" },
        { q: "How do you handle feedback on your creative work?", type: "hr" },
        { q: "What excites you most about the future of marketing?", type: "hr" },
        { q: "How do you prioritize when you have multiple campaigns running?", type: "hr" },
        { q: "Why are you interested in working at our company specifically?", type: "hr" },
        { q: "Do you have questions about our marketing team or goals?", type: "hr" },
    ],

    // ══════════════════════════════════════════════
    // FINANCE — 80 questions
    // ══════════════════════════════════════════════
    finance: [
        // Technical
        { q: "Explain the three financial statements and how they connect.", type: "technical" },
        { q: "What is DCF analysis and how do you apply it?", type: "technical" },
        { q: "How do you calculate WACC?", type: "technical" },
        { q: "Explain the difference between GAAP and IFRS.", type: "technical" },
        { q: "What is working capital and why is it important?", type: "technical" },
        { q: "How do you value a company?", type: "technical" },
        { q: "What is EBITDA and why is it widely used?", type: "technical" },
        { q: "Explain net present value (NPV).", type: "technical" },
        { q: "What is internal rate of return (IRR)?", type: "technical" },
        { q: "What is the difference between gross margin and net margin?", type: "technical" },
        { q: "What is a balance sheet?", type: "technical" },
        { q: "What is the difference between cash flow and profit?", type: "technical" },
        { q: "What is a P/E ratio and how do you use it?", type: "technical" },
        { q: "Explain the concept of amortization and depreciation.", type: "technical" },
        { q: "What is financial leverage and what are the risks?", type: "technical" },
        { q: "What is hedging and why do companies use it?", type: "technical" },
        { q: "Explain what bonds are and how bond pricing works.", type: "technical" },
        { q: "What is the difference between equity and debt financing?", type: "technical" },
        { q: "What is a credit rating and why does it matter?", type: "technical" },
        { q: "What is Basel III and why was it introduced?", type: "technical" },
        { q: "Explain what options contracts are.", type: "technical" },
        { q: "What is revenue recognition?", type: "technical" },
        { q: "What is a budget variance and how do you analyze it?", type: "technical" },
        { q: "Explain what a goodwill impairment is.", type: "technical" },
        { q: "What is accounts receivable and accounts payable?", type: "technical" },
        { q: "What is the Sarbanes-Oxley Act?", type: "technical" },
        { q: "What is a financial model and what tools do you use to build one?", type: "technical" },
        { q: "What is Monte Carlo simulation in finance?", type: "technical" },
        { q: "Explain what derivatives are.", type: "technical" },
        { q: "What is the difference between systematic and unsystematic risk?", type: "technical" },
        { q: "What is a sensitivity analysis?", type: "technical" },
        { q: "Explain what an LBO (leveraged buyout) is.", type: "technical" },
        { q: "What is the efficient market hypothesis?", type: "technical" },
        { q: "What is the Capital Asset Pricing Model (CAPM)?", type: "technical" },
        { q: "What is a dividend yield?", type: "technical" },
        { q: "Explain the concept of beta in investing.", type: "technical" },
        { q: "What is quantitative easing?", type: "technical" },
        { q: "What is a treasury bond?", type: "technical" },
        { q: "What is the difference between fixed and variable costs?", type: "technical" },
        { q: "How do interest rate changes affect the stock market?", type: "technical" },
        // Behavioral
        { q: "Describe a time you identified a financial discrepancy.", type: "behavioral" },
        { q: "How do you handle pressure during financial close periods?", type: "behavioral" },
        { q: "Tell me about a financial analysis that changed a business decision.", type: "behavioral" },
        { q: "Describe a time you had to present bad financial news to stakeholders.", type: "behavioral" },
        { q: "Tell me about a process improvement you implemented in finance.", type: "behavioral" },
        { q: "How do you handle ethical dilemmas in finance?", type: "behavioral" },
        { q: "Describe a time you had to explain complex financial data to a non-finance person.", type: "behavioral" },
        { q: "Tell me about a time you worked under extreme deadline pressure.", type: "behavioral" },
        { q: "How do you handle uncertainty in financial forecasting?", type: "behavioral" },
        { q: "Describe a time you disagreed with a financial decision and how you handled it.", type: "behavioral" },
        // HR
        { q: "Why did you choose a career in finance?", type: "hr" },
        { q: "What financial certifications are you pursuing or have you completed?", type: "hr" },
        { q: "What are your salary expectations?", type: "hr" },
        { q: "Why are you interested in this finance role?", type: "hr" },
        { q: "What is your greatest professional achievement in finance?", type: "hr" },
        { q: "Where do you see yourself in 5 years?", type: "hr" },
        { q: "What do you consider your biggest weakness?", type: "hr" },
        { q: "How do you stay current with financial regulations and market trends?", type: "hr" },
        { q: "Describe your ideal work environment.", type: "hr" },
        { q: "What motivates you in a finance career?", type: "hr" },
        { q: "How do you handle confidential financial information?", type: "hr" },
        { q: "What do you know about our company's financial performance?", type: "hr" },
        { q: "How do you approach continuous learning in finance?", type: "hr" },
        { q: "What would your previous colleagues say about your work ethic?", type: "hr" },
        { q: "Why should we hire you over other finance candidates?", type: "hr" },
        { q: "How do you balance accuracy with speed in financial work?", type: "hr" },
        { q: "What tools and software are you proficient in for financial analysis?", type: "hr" },
        { q: "Describe how you manage stress in high-stakes situations.", type: "hr" },
        { q: "Why are you leaving your current position?", type: "hr" },
        { q: "Do you have any questions for me about this role?", type: "hr" },
    ],

    // ══════════════════════════════════════════════
    // DATA SCIENCE / AI / ML — 80 questions
    // ══════════════════════════════════════════════
    datascience: [
        // Technical
        { q: "What is the difference between supervised and unsupervised learning?", type: "technical" },
        { q: "Explain what overfitting is and how you prevent it.", type: "technical" },
        { q: "What is the bias-variance tradeoff?", type: "technical" },
        { q: "Explain how a random forest works.", type: "technical" },
        { q: "What is gradient descent and how does it work?", type: "technical" },
        { q: "What is the difference between classification and regression?", type: "technical" },
        { q: "Explain precision and recall. When do you optimize for each?", type: "technical" },
        { q: "What is cross-validation and why is it important?", type: "technical" },
        { q: "What is a confusion matrix?", type: "technical" },
        { q: "Explain the concept of feature engineering.", type: "technical" },
        { q: "What is PCA (Principal Component Analysis)?", type: "technical" },
        { q: "What is the difference between a neural network and a decision tree?", type: "technical" },
        { q: "What is regularization? Explain L1 and L2.", type: "technical" },
        { q: "What is the difference between bagging and boosting?", type: "technical" },
        { q: "Explain what k-means clustering does.", type: "technical" },
        { q: "What is the curse of dimensionality?", type: "technical" },
        { q: "What is a p-value and how do you interpret it?", type: "technical" },
        { q: "What is A/B testing in a data science context?", type: "technical" },
        { q: "Explain the difference between correlation and causation.", type: "technical" },
        { q: "What is a ROC curve and AUC?", type: "technical" },
        { q: "What is natural language processing (NLP)?", type: "technical" },
        { q: "What is the difference between deep learning and machine learning?", type: "technical" },
        { q: "Explain convolutional neural networks (CNN).", type: "technical" },
        { q: "What is a recurrent neural network (RNN)?", type: "technical" },
        { q: "What is transfer learning?", type: "technical" },
        { q: "What is a recommendation system and how does it work?", type: "technical" },
        { q: "What is SQL and how do you use it in data science?", type: "technical" },
        { q: "What Python libraries do you use for data science?", type: "technical" },
        { q: "What is the difference between pandas and NumPy?", type: "technical" },
        { q: "Explain what ETL means in data engineering.", type: "technical" },
        { q: "What is data normalization and when is it needed?", type: "technical" },
        { q: "How do you handle missing data in a dataset?", type: "technical" },
        { q: "What is an outlier and how do you detect it?", type: "technical" },
        { q: "What is time series analysis?", type: "technical" },
        { q: "What is hyperparameter tuning?", type: "technical" },
        { q: "Explain the difference between batch and online learning.", type: "technical" },
        { q: "What is a data pipeline?", type: "technical" },
        { q: "What is model deployment and what tools do you use?", type: "technical" },
        { q: "What is the difference between data analytics and data science?", type: "technical" },
        { q: "How would you evaluate the performance of a regression model?", type: "technical" },
        // Behavioral
        { q: "Tell me about a data project you are most proud of.", type: "behavioral" },
        { q: "Describe a time a model you built did not perform as expected.", type: "behavioral" },
        { q: "How do you communicate complex data findings to non-technical stakeholders?", type: "behavioral" },
        { q: "Tell me about a time you had to work with messy, incomplete data.", type: "behavioral" },
        { q: "Describe a time you used data to change a business decision.", type: "behavioral" },
        { q: "How do you approach a data problem you have never seen before?", type: "behavioral" },
        { q: "Tell me about a time you collaborated with engineers or product managers.", type: "behavioral" },
        { q: "How do you prioritize which analysis to do when time is limited?", type: "behavioral" },
        { q: "Describe a time you identified a data quality issue.", type: "behavioral" },
        { q: "How do you stay up to date with ML research and new techniques?", type: "behavioral" },
        // HR
        { q: "Why did you choose data science as a career?", type: "hr" },
        { q: "What are your strengths as a data scientist?", type: "hr" },
        { q: "What is your biggest weakness in data science?", type: "hr" },
        { q: "Where do you see yourself in 5 years in this field?", type: "hr" },
        { q: "Why are you interested in this data science role?", type: "hr" },
        { q: "What are your salary expectations?", type: "hr" },
        { q: "What is your greatest professional achievement?", type: "hr" },
        { q: "How do you handle working on ambiguous problems?", type: "hr" },
        { q: "Do you prefer working on modeling or on analysis and insights?", type: "hr" },
        { q: "Describe your ideal team environment.", type: "hr" },
        { q: "How do you balance speed of delivery with accuracy of your models?", type: "hr" },
        { q: "What do you know about AI ethics and how do you handle bias in data?", type: "hr" },
        { q: "Why should we hire you over other data science candidates?", type: "hr" },
        { q: "What tools and platforms are you most proficient in?", type: "hr" },
        { q: "How do you approach continuous learning in such a fast-moving field?", type: "hr" },
        { q: "What excites you most about machine learning and AI right now?", type: "hr" },
        { q: "How do you handle a model that is deployed and suddenly performs poorly?", type: "hr" },
        { q: "Describe how you handle feedback or criticism on your analytical work.", type: "hr" },
        { q: "Why are you leaving your current role?", type: "hr" },
        { q: "Do you have any questions about the data team or our tech stack?", type: "hr" },
    ],

    // ══════════════════════════════════════════════
    // HR / MANAGEMENT — 80 questions (general HR use-case)
    // ══════════════════════════════════════════════
    hr_general: [
        // Technical
        { q: "What is the difference between recruitment and talent acquisition?", type: "technical" },
        { q: "Explain what competency-based interviewing is.", type: "technical" },
        { q: "What is an employee value proposition (EVP)?", type: "technical" },
        { q: "How do you calculate employee turnover rate?", type: "technical" },
        { q: "What is an HRIS and which systems have you worked with?", type: "technical" },
        { q: "What is performance management and how do you design a system?", type: "technical" },
        { q: "Explain the difference between job evaluation and job analysis.", type: "technical" },
        { q: "What is an OKR (Objectives and Key Results) framework?", type: "technical" },
        { q: "What are some key employment laws you must know in your region?", type: "technical" },
        { q: "What is employer branding and how do you build it?", type: "technical" },
        { q: "How do you structure an onboarding program for new employees?", type: "technical" },
        { q: "What is succession planning?", type: "technical" },
        { q: "What is the difference between training and development?", type: "technical" },
        { q: "What is a 360-degree feedback process?", type: "technical" },
        { q: "How do you handle a grievance or HR complaint?", type: "technical" },
        { q: "What is organizational culture and how do you measure it?", type: "technical" },
        { q: "Explain what diversity, equity, and inclusion (DEI) means in the workplace.", type: "technical" },
        { q: "What are key metrics an HR professional should track?", type: "technical" },
        { q: "What is the difference between a fixed and variable compensation structure?", type: "technical" },
        { q: "How do you conduct a job needs analysis?", type: "technical" },
        { q: "What is an ATS and how do you use it in recruitment?", type: "technical" },
        { q: "Explain what a structured interview is.", type: "technical" },
        { q: "What is organizational development (OD)?", type: "technical" },
        { q: "What is change management and what models do you use?", type: "technical" },
        { q: "How do you calculate cost-per-hire?", type: "technical" },
        { q: "What is HR analytics and how is it used?", type: "technical" },
        { q: "What is the purpose of an exit interview?", type: "technical" },
        { q: "What is a job grade structure?", type: "technical" },
        { q: "What is the role of HR in mergers and acquisitions?", type: "technical" },
        { q: "How do you build an L&D (learning and development) strategy?", type: "technical" },
        { q: "What is high potential employee identification?", type: "technical" },
        { q: "How do you handle a toxic employee who is a top performer?", type: "technical" },
        { q: "What is a competency framework?", type: "technical" },
        { q: "How do you manage remote employee engagement?", type: "technical" },
        { q: "What is the difference between transactional and strategic HR?", type: "technical" },
        { q: "What is a talent pipeline?", type: "technical" },
        { q: "How do you ensure compliance in payroll processing?", type: "technical" },
        { q: "What is HR's role in conflict resolution?", type: "technical" },
        { q: "Explain what psychological safety in the workplace means.", type: "technical" },
        { q: "What is an employee assistance program (EAP)?", type: "technical" },
        // Behavioral
        { q: "Tell me about a time you handled a difficult performance management case.", type: "behavioral" },
        { q: "Describe a time you successfully improved employee engagement.", type: "behavioral" },
        { q: "Tell me about a tough hiring decision you made.", type: "behavioral" },
        { q: "Describe a time you had to implement an unpopular HR policy.", type: "behavioral" },
        { q: "How have you handled a complaint about discrimination or harassment?", type: "behavioral" },
        { q: "Tell me about a time you drove a successful organizational change.", type: "behavioral" },
        { q: "Describe a situation where you had to manage conflicts between two employees.", type: "behavioral" },
        { q: "Tell me about a time you reduced employee turnover.", type: "behavioral" },
        { q: "How have you improved a recruitment process?", type: "behavioral" },
        { q: "Describe a time you had to balance the needs of employees and management.", type: "behavioral" },
        // HR
        { q: "Why did you choose HR as a career?", type: "hr" },
        { q: "What do you think is the most important role of HR in an organization?", type: "hr" },
        { q: "What are your greatest strengths as an HR professional?", type: "hr" },
        { q: "What is your biggest weakness in HR?", type: "hr" },
        { q: "Where do you see yourself in 5 years?", type: "hr" },
        { q: "What certifications or professional development have you pursued?", type: "hr" },
        { q: "What are your salary expectations?", type: "hr" },
        { q: "Why are you interested in this HR role specifically?", type: "hr" },
        { q: "How do you handle confidential employee information?", type: "hr" },
        { q: "How do you stay up to date with employment law and HR best practices?", type: "hr" },
        { q: "What is your approach to building trust with employees?", type: "hr" },
        { q: "How do you balance being an employee advocate with business needs?", type: "hr" },
        { q: "Describe your ideal relationship with business leaders as an HR partner.", type: "hr" },
        { q: "What HR technology tools are you most experienced with?", type: "hr" },
        { q: "How do you measure your own success in an HR role?", type: "hr" },
        { q: "Why should we choose you over other HR candidates?", type: "hr" },
        { q: "What is the biggest challenge facing HR professionals today?", type: "hr" },
        { q: "How do you handle a very difficult or emotional employee situation?", type: "hr" },
        { q: "Why are you leaving your current HR position?", type: "hr" },
        { q: "Do you have any questions for me about the team or HR function here?", type: "hr" },
    ],
};

// Field name → bank key mapping
const fieldMapping = {
    'software': 'software',
    'software engineering': 'software',
    'computer science': 'software',
    'cs': 'software',
    'tech': 'software',
    'technology': 'software',
    'it': 'software',
    'web development': 'software',
    'engineering': 'software',
    'coding': 'software',
    'programming': 'software',
    'marketing': 'marketing',
    'digital marketing': 'marketing',
    'advertising': 'marketing',
    'pr': 'marketing',
    'communications': 'marketing',
    'branding': 'marketing',
    'finance': 'finance',
    'accounting': 'finance',
    'banking': 'finance',
    'investment': 'finance',
    'economics': 'finance',
    'fintech': 'finance',
    'data science': 'datascience',
    'data': 'datascience',
    'machine learning': 'datascience',
    'ml': 'datascience',
    'ai': 'datascience',
    'artificial intelligence': 'datascience',
    'analytics': 'datascience',
    'data analytics': 'datascience',
    'hr': 'hr_general',
    'human resources': 'hr_general',
    'management': 'hr_general',
    'people operations': 'hr_general',
};

function shuffle(arr) {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
}

export class QuestionEngine {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
    }

    generateQuestions(config) {
        const { field, experience, interviewType } = config;

        const fieldKey = fieldMapping[field?.toLowerCase()] || 'software';
        let pool = questionBank[fieldKey] || questionBank.software;

        // Filter by interview type if not mixed
        if (interviewType && interviewType !== 'mixed') {
            const filtered = pool.filter(q => q.type === interviewType);
            pool = filtered.length >= 5 ? filtered : pool;
        }

        // Always shuffle
        pool = shuffle(pool);

        // Session length: pick up to 15 questions (teacher: 80 in dataset, ~15 per session)
        this.questions = pool.slice(0, 15);
        this.currentIndex = 0;
        return this.questions;
    }

    shuffle(arr) { return shuffle(arr); }

    getCurrentQuestion() {
        if (this.currentIndex >= this.questions.length) return null;
        return this.questions[this.currentIndex];
    }

    getQuestionNumber() { return this.currentIndex + 1; }
    getTotalQuestions() { return this.questions.length; }

    getProgress() {
        return this.questions.length > 0
            ? (this.currentIndex / this.questions.length) * 100
            : 0;
    }

    nextQuestion() {
        this.currentIndex++;
        return this.getCurrentQuestion();
    }

    isComplete() {
        return this.currentIndex >= this.questions.length;
    }

    getTypeLabel(type) {
        const labels = {
            technical: '💻 Technical',
            behavioral: '🎯 Behavioral',
            hr: '👔 HR',
            mixed: '🔀 Mixed'
        };
        return labels[type] || type;
    }

    // How many questions exist for a given field
    static getFieldCount(field) {
        const key = fieldMapping[field?.toLowerCase()] || field;
        return (questionBank[key] || []).length;
    }
}

export const questionEngine = new QuestionEngine();
