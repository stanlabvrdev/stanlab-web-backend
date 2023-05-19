export const sampleText =
  "All code changes will be made on the dev branch.  4. Pull requests are then made to the dev branch for review, from your  local branch.  5. Name your branch with a pull request of ch or ft depending on whether  it is a chore or feature.  6. Each pull request should elaborately explain what the added code does  and how to test it.  7. Someone else must review the code before it is merged.  8. Pull request names must include a prefix, a body and a short  description. Features should have the   feat   prefix e.g   feat (added  payment functionality ): added payment controllers and route . Chores should have the   chore   prefix e.g   chore (setup database):connected to  mongoDb.  9. All pull request must be linked to an issue  10.   The issue will contain information about what should be achieved by  a pull request  General Tools  1. ClickUp for project management  2. Github for code repos  3. Postman collection for api documentation  4. Prettier VS code extension  5. Eslint for linting  6. Npm  7. Architecture - monolithic";

export const data = {
  data: {
    "What does each pull request explain?": ["Correspondence", "Prescription", "Print", "Ans: Code"],
    "What is it called when a branch has a ch or ft pull request?": ["Job", "Ans: Chore", "Function", "Assignment"],
    "What must someone else do to the code before it's merged?": ["Revue", "Minstrel Show", "Ans: Review", "Vaudeville"],
    "What should elaborately explain what the added code does and how to test it?": ["Body", "Ans: Requests", "Approval", "Acknowledgment"],
    "What should you name your branch with pull requests of ch or ft depending on whether it is a chore or feature?": ["Ans: Branch", "Aftereffect", "Bandwagon Effect", "Aftermath"],
    "What type of branch should a branch have pull requests of ch or ft depending on?": ["Cinema Verite", "Coming Attraction", "Ans: Feature", "Collage Film"],
  },
};

export const tfData = {
  data: [
    [
      "True: Pull requests are then made to the dev branch for review, from your  local branch",
      "Pull requests are then made to the dev branch for review, from this point forward.",
      "Pull requests are then made to the dev branch for review, from which developers can easily apply patches.",
      "Pull requests are then made to the dev branch for review, from time-to (usually within 24 hours)\n" + "… that's it!",
    ],
    [
      "True: Name your branch with a pull request of ch or ft depending on whether  it is a chore or feature",
      "Name your branch with a pull request of ch or ft depending on whether it is to be moved, rename the file.",
      "Name your branch with a pull request of ch or ft depending on whether it is in the build system's dev-mode (i.e., 'develop' ).",
      "Name your branch with a pull request of ch or ft depending on whether it is in development, alpha/beta releases as well the source (git clone).",
      "Name your branch with a pull request of ch or ft depending on whether it supports the CURRENT VERSION.",
      "Name your branch with a pull request of ch or ft depending on whether it would be an alpha channel for us.",
      "Name your branch with a pull request of ch or ft depending on whether it is an optional package (as in the example above) and then click submit.",
    ],
    [
      "True: Each pull request should elaborately explain what the added code does  and how to test it",
      "Each pull request should elaborately explain what the added code does and how to use it in a given function, but that won't be possible at this point.",
    ],
    [
      "True: Pull request names must include a prefix, a body and a short  description",
      "Pull request names must include a prefix, a body and the formatter.",
      "Pull request names must include a prefix, a body and the URL to be used.",
      "Pull request names must include a prefix, a body and @{} (or other) value.",
    ],
    [
      "True: All pull request must be linked to an issue  10",
      "All pull request must be linked to an HTTP 404.",
      "All pull request must be linked to your project by the author of all Pull Request.",
      "All pull request must be linked to the previous Pull Request, otherwise it will fail.",
      "All pull request must be made.",
      "All pull request must be a valid one.",
      "All pull request must be from /var/www/.",
    ],
  ],
};
