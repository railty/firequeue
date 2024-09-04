saving tasks in doc("celery") is not ideal, first it has performance implication, say we have 1000 tasks in the array, it become a problem. In firebase, you cannot query/update the array element, you have to download the whole array and update local and then upload the whole array.

second, the worker will remove the task from the array, working on it and then create the result. if the task takes 60 seconds, during these 60 seconds, the task is gone from the system. it is not in the tasks array, and the result is not created yet.

my plan is to use the result collection as the tasks array.
 