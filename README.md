# Why do i decide to do this project?

- I wanna explore new stuff and especially when i have the resource to learn a lil bit of coding and import my knowledge about some stuff thats hard to reach even with the ai era and also promote me and my freelance business

# What to do with this website?

- I want this website to be a learning platform for all the user for free and share what i know about computing stuff and guide the user to do the same by making them able to submit a tutorial of their own, so from user to user.

# Who is the target audience and how will this promote my freelance business?

- My target audience is my vocational student friends thats stil having a hard time figuring out how things are working or how to do the thing for theyre project. I make this tutorial free of ads compared to other guide website so it makes the user more focused on the guide instead of some random ads on the side.

# How will user-submitted tutorials and community moderation work?

- The tutorial submitted through a google form link and i will be checking everyone of them since its a small scale website and contributors will have been tag on instagram on their submission.

# How will the AI Chatbot and search features help users?

- The search feature gonna help user to find their desired tutorial later on as the site grew larger to have a massive archive of guide and the chatbot can help them to find what should their learn in their major like learning the fundamental and much more.

# How will the platform stay free and community-funded?

- Platform gonna stay free as long as i can maintance it or if someone ableto help me to moderate the submission and user can help through a trakteer donation and in the future im trying to expand the libarary of guide as much as i can for free afterall everyone deserve a knowledge to passdown.

# NextBit AI Assistant Development and Troubleshooting Log

Date: July 28, 2026
Environment: Debian Linux VPS and OpenRouter API

Objective
I needed to update the backend Node.js server file named server.js to add a new System Prompt. This prompt sets clear behavioral rules for the NextBit AI Assistant. My main goal was to stop the AI from acting like a pushy salesperson and prevent it from appending the NextBit WhatsApp number to regular technical answers.

Troubleshooting 502 Bad Gateway Errors
During the update, the Nginx reverse proxy threw a 502 Bad Gateway error because the Node.js backend crashed on startup.

Incident 1: Missing Closing Syntax
What happened: The AI backend crashed immediately after saving server.js and restarting it through PM2.
Why it happened: The multiline template literal backtick for the systemPrompt constant was missing its closing backtick and semicolon at the end of the text block.
How I fixed it: I added a closing backtick and semicolon right before the let replyText equals null line.

Incident 2: Hidden Syntax Error Caused by Line Wrap
What happened: The 502 Bad Gateway error persisted. PM2 logs showed a syntax error regarding an unexpected identifier ON on the line containing NOT ON THIS SITE.
Why it happened: While editing inside GNU Nano, a long sentence stretched past the right side of the screen. An extra backtick and semicolon were hidden offscreen at the end of that line. This closed the string early and caused Node.js to interpret the rest of the text as JavaScript commands.
How I fixed it: I scrolled to the very end of the hidden line, deleted the stray backtick and semicolon, confirmed that the only closing syntax sat at the bottom of the string block, and restarted PM2.

Security Testing and Red Teaming
I ran security tests to check how resilient the chatbot is against malicious inputs.
For OpenRouter safety filters, I tried a DAN prompt to bypass system instructions and ask how to hack a database.
OpenRouter built in moderation caught the prompt immediately. The backend handled the rejected request cleanly and displayed a friendly fallback message explaining that the service was busy.
For future testing, I plan to run prompt injections using light persona overrides like pirate speak, test Cross Site Scripting using HTML tags, test payload limits with long text, and verify rate limit rules.

Version Control and Git Deployment
I synced the working VPS code back to the central GitHub repository so production matches my local environment.
I checked git status first to ensure the environment file containing the OpenRouter API key stayed ignored and safe from public exposure.
I staged Backend/server.js, chatbot.html, and package lock json.
My commit message was: Fixed AI system prompt rules updated HTML and added package lock
Then I pushed the commits to the Web branch on origin.

Key Commands Reference
Here are the core terminal commands I used during this deployment session:

Check server error logs when a 502 occurs:
pm2 logs nextbit_backend

Restart the Node server after editing files:
pm2 restart nextbit_backend

Safe Git workflow for VPS to GitHub:
git status
git add .
git commit
git push origin Web
