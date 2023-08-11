## TimeTable Document

A TimeTable document serves as a comprehensive representation of a schedule for activities within an educational institution. It is meticulously organized based on the days of the week and specific time slots.

- `id`: Unique Object ID (automatically generated)
- `admin`: Reference Object ID to the school administrator responsible for overseeing the timetable.
- `collaborators`: An array of Object IDs that pertain to contributors actively involved in the timetable's creation. These collaborators encompass teachers or sub-administrators.
- `class`: A reference Object ID pointing to the class for which the timetable has been designed. Alternatively, a string representation is utilized if no Object ID reference is available.
- `timestamps`: A boolean value denoted as 'True,' indicating the utilization of automatic timestamping mechanisms for the purpose of tracking creation and updates.
- `published`: A boolean value with a default state of 'draft.' This value signifies whether the timetable has undergone the process of being published.

## TimeSlots Document

The TimeSlots document is specifically designed to represent distinct time segments within a given day's timetable.

- `id`: Distinct Object ID (generated automatically)
- `day`: Enumerated field indicating the day of the week (e.g., Monday, Tuesday, and so forth).
- `timetable`: Reference Object ID linked to the timetable to which this particular time slot belongs.
- `startTime`: A numerical value spanning from 0 to 1339 (where 0 corresponds to 12:00 AM, and 1339 corresponds to 11:59 PM). This value signifies the initiation time of the time slot.
- `endTime`: A numerical value ranging from 1 to 1440 (where 1 signifies 12:01 AM, and 1440 represents 11:59 PM). This value indicates the conclusion time of the time slot.
- `teacher`: A reference Object ID or string denoting the teacher assigned to oversee the activity encompassed by the time slot.
- `activity`: A string delineating the type of activity transpiring within the time slot. In cases where such specification is absent, the field remains undefined.
- `subject`: A string signifying the subject associated with the activity within the time slot. When not specified, the field retains an undefined state.
- `description`: A string that provides a detailed description of the activity transpiring within the time slot. In instances of absence, the field remains undefined.
- `topic`: A string indicating the topic affiliated with the activity occurring in the time slot. When not explicitly stated, the field assumes an undefined status.
- Additional data fields...

Additionally, the TimeSlots document incorporates a virtually computed field:

- `timeString`: A calculated field that represents the time range of the time slot (e.g., "8 AM - 9 AM").

## Data Presentation upon Successful Request

Upon the successful execution of a request, the response structure is organized as follows:

```json
{
  "timetable": {
    // ...timetable details
  },
  "data": {
    "mon": [
      /* timetable objects */
    ],
    "tue": [
      /* timetable objects */
    ],
    // ... (likewise for other days)
    "sun": [
      /* timetable objects */
    ]
  }
}
```

## Utility Functions

Various utility functions have been designed to enhance the operational efficiency and accuracy of the timetable management system:

- Function to examine conflicting timestamps
- Function to analyze changes in a timestamp object, aimed at minimizing database queries during updates
- Function to ensure that daily timestamp ranges do not surpass specified time limits
- Function to validate the validity of start and end times as per defined constraints
- Function to transform fetched database results into easily searchable data structures
- Function to assess the availability of teachers through their respective IDs, involving checks for overlapping timestamps within timetables of other classes and teacher availability
- Function to obtain timetables of the same school, facilitating better grouping strategies

## Timetable Creation

The process of creating a timetable involves the following steps:

1. Validate the entered data structure
2. Retrieve timetables of other classes within the school and convert them into a searchable data structure.
3. Check for conflict with those other timetables with a focus on teacher availability, If no conflicting timetables are found, conduct validations and save the timetable.
4. If conflicts arise at any stage generate informative error messages regarding errors. Provide detailed information along with the original entry to ensure consistent client-side state maintenance.
5. If no issues arise, proceed with saving the timetable.

## Timetable Update

The procedure for updating a timetable is outlined below:

1. Retrieve timetables of other classes and the current state of the timetable being edited. Convert this information into a searchable data structure.
2. Validate the entered data and, upon validation, check for conflicts with other timetables.
3. If the validation is satisfactory, perform checks on the existing state of the timetable being edited to minimize the number of queries required for updating.
4. If all checks are successful, proceed with the update. In cases of errors, detailed descriptions are provided, and the entered data is included in the error response to maintain the client-side state.
