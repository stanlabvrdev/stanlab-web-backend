import { inMemoryCache } from "../../localstorage";
import { LabExperiment } from "../../models/labAssignment";

import systemExperiments, { SystemExperiment } from "../../models/systemExperiments";

class InternalScript {
  async cleanUps(): Promise<any> {
    const labs = await LabExperiment.find();

    const cached = inMemoryCache.getData();

    // const data = cached.data;

    // await this.updateData(cached.data);

    // console.log(cached);

    let saveData: any[] = [];

    let count = labs.length;

    for (let lab of labs) {
      console.log(count);
      const code = this.generateCode();
      const experiment: SystemExperiment | null = await systemExperiments.findOne({ _id: lab.experiment });

      if (experiment) {
        const experimentData = {
          name: `${experiment.name} ${code}`,
          icon: experiment.icon || null,
          subject: experiment.subject,
          _id: experiment._id!,
          code,
          practicalName: experiment.practicalName || null,
          class: experiment.class,
          demoVideoUrl: experiment.demoVideoUrl,
        };
        saveData.push({
          id: lab._id,
          experiment: experimentData,
        });

        console.log(experimentData);
      }
      count--;
    }

    console.log(saveData);

    inMemoryCache.saveData({ id: "123", data: saveData });

    console.log(labs);
    return null;
  }

  private generateCode(): string {
    return Math.random().toString().slice(-3);
  }

  private async updateData(data: any[]) {
    let count = data.length;
    for (let item of data) {
      console.log(count);
      const result = await LabExperiment.updateOne({ _id: item.id }, { experiment: item.experiment });
      console.log(result);
      count--;
    }
  }
}

export const internalScript = new InternalScript();
