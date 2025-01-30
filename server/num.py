# import random
# for i in range(0,10):
#     random_int = random.randint(100, 999)
#     print(random_int)

from datetime import datetime
dt1 = datetime(2023, 1, 1, 00, 00)
dt2 = datetime(2023, 1, 2, 00, 00)

# Calculate the difference
time_diff = dt2 - dt1

# Print the difference
print(time_diff.total_seconds()/3600/24)