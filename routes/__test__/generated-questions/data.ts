import { faker } from "@faker-js/faker";

function generateRandomPassage() {
  let passage = "";
  for (let i = 0; i < 70; i++) {
    passage += faker.lorem.sentence() + " ";
  }
  return passage.trim();
}

function generateData() {
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

function generateOptions(numOptions: number) {
  const options: string[] = [];

  for (let i = 0; i < numOptions; i++) {
    const isTrueOption = faker.datatype.boolean();
    const optionText = `${isTrueOption ? "True" : "False"}: ${faker.lorem.sentence()}`;
    options.push(optionText);
  }

  return options;
}

export const sampleText = generateRandomPassage();
export const data = generateData();
export const tfData = {
  data: [generateOptions(4), generateOptions(7), generateOptions(2)],
};
