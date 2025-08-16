import unittest
import os

class TestAFile(unittest.TestCase):
    def test_a_file(self):
        filepath = 'a_task/A.txt'

        # 1. Check if the file exists
        self.assertTrue(os.path.exists(filepath), "File A.txt does not exist")

        # 2. Check if the file size is 20 KB
        file_size = os.path.getsize(filepath)
        self.assertEqual(file_size, 20 * 1024, f"File size is not 20 KB, but {file_size} bytes")

        # 3. Check the file content
        with open(filepath, 'r') as f:
            content = f.read()

        # Check that the content is "A " repeated
        expected_content = "A " * (20 * 1024 // 2)
        self.assertEqual(content, expected_content, "File content is not correct")

        # 4. Check for no trailing newline
        self.assertFalse(content.endswith('\n'), "File should not have a trailing newline")

if __name__ == '__main__':
    unittest.main()
