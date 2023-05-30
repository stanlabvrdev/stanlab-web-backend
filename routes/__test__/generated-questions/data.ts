import { faker } from "@faker-js/faker";

function generateRandomPassage() {
  let passage = "";
  for (let i = 0; i < 70; i++) {
    passage += faker.lorem.sentence() + " ";
  }
  return passage.trim();
}

function generateFakeMcqData() {
  const data = {
    data: {},
  };

  for (let i = 0; i < 6; i++) {
    const question = faker.lorem.sentence();
    const options: string[] = [];

    for (let j = 0; j < 4; j++) {
      const option = faker.random.word();
      options.push(option);
    }

    const answerIndex = faker.datatype.number({ min: 0, max: 3 });
    options[answerIndex] = `Ans: ${options[answerIndex]}`;

    data.data[question] = options;
  }

  return data;
}

function generateFakeOptions(numOptions: number) {
  const options: string[] = [];

  for (let i = 0; i < numOptions; i++) {
    const isTrueOption = faker.datatype.boolean();
    const optionText = `${isTrueOption ? "True" : "False"}: ${faker.lorem.sentence()}`;
    options.push(optionText);
  }

  return options;
}

function generateFakeQuestionObjects(questionType: string) {
  const numObjects = Math.floor(Math.random() * 14) + 2; // Random number between 2 and 15
  const fakeObjects: any = [];

  for (let i = 0; i < numObjects; i++) {
    let fakeObject;

    if (questionType === "TOF") {
      fakeObject = {
        options: [
          {
            isCorrect: true,
            answer: "True",
          },
          {
            isCorrect: false,
            answer: "False",
          },
        ],
        type: "TOF",
      };
    } else if (questionType === "MCQ") {
      fakeObject = {
        question: faker.lorem.sentence(),
        options: [
          {
            isCorrect: false,
            answer: faker.lorem.word(),
          },
          {
            isCorrect: false,
            answer: faker.lorem.word(),
          },
          {
            isCorrect: false,
            answer: faker.lorem.word(),
          },
          {
            isCorrect: true,
            answer: faker.lorem.word(),
          },
        ],
        type: "MCQ",
      };
    } else {
      throw new Error("Invalid question type");
    }

    fakeObjects.push(fakeObject);
  }

  return fakeObjects;
}

export const randoPassage = generateRandomPassage();
export const fakeMCQData = generateFakeMcqData();
export const fakeTOFData = {
  data: [generateFakeOptions(4), generateFakeOptions(7), generateFakeOptions(2)],
};

export const fakeMCQQuestions = generateFakeQuestionObjects("MCQ");
export const fakeTOFQuestions = generateFakeQuestionObjects("TOF");
