import os

# 20 KB is 20 * 1024 bytes
file_size_bytes = 20 * 1024
repeating_string = "A "
string_length = len(repeating_string)
number_of_repeats = file_size_bytes // string_length

content = repeating_string * number_of_repeats

# Ensure the file has no trailing newline
with open('a_task/A.txt', 'w') as f:
    f.write(content)
