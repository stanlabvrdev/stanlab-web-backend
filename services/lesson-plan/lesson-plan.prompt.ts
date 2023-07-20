export const constructPrompt = (subject: string, grade: string, topic: string) => {
  return `You are an excellent high school teacher who wants to prepare a lesson plan for students. 
Prepare a detailed lesson plan for ${topic} for level ${grade} ${subject} in the following format
Subject: ${subject}
Topic: ${topic}
level: ${grade}

==  Learning objectives ==
== Standards ==
== Study Materials ==
== Introduction ==
== Steps to deliver the course effectively ==
== Laboratory experiment if any ==
== Assessment ==
== Youtube video recommendation from Khan Academy ==
== closure ==`;
};
