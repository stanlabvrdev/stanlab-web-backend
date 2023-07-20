import { LessonPlanModel } from "../../../models/lesson-plan.model";

export const sampleMarkdown = `# Welcome to the Amazing World of Markdown!

Markdown is a lightweight markup language that allows you to format plain text into rich content with ease. It was created by John Gruber and Aaron Swartz to provide a simple way of writing structured documents without getting in the way of the writing process.

With Markdown, you can easily create headings using the '#' symbol, add emphasis to your text with asterisks or underscores, and create lists with bullets or numbers. Additionally, you can insert links, images, and even code snippets effortlessly.

If you want to include code blocks, simply wrap the code with triple backticks, followed by the language name for syntax highlighting. For example:

\`\`\`javascript
const greeting = "Hello, Markdown!";
console.log(greeting);
\`\`\`

Markdown is widely supported across various platforms, including GitHub, Reddit, and many blogging platforms. It's the go-to format for writing documentation, README files, and blog posts.

In conclusion, Markdown is a powerful and versatile language that empowers you to focus on your content without worrying about complex formatting. Whether you're a developer, writer, or blogger, Markdown is an essential tool in your arsenal.

So, go ahead and start using Markdown to express your ideas in a clear and stylish way. Happy writing!`;

export const createLessonPlan = async (_id: string) => {
  return await LessonPlanModel.create({
    teacher: _id,
    subject: "Biology",
    grade: "Grade 9",
    topic: "Pollination",
    lessonPlan: "Sample lesson Plan",
  });
};
