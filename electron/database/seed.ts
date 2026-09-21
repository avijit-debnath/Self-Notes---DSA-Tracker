export interface SeedData {
  branches: {
    id: string;
    parent_id: string | null;
    name: string;
    order_index: number;
    is_starred: number;
    is_deleted: number;
    created_at: string;
    updated_at: string;
  }[];
  questions: {
    id: string;
    branch_id: string;
    title: string;
    url: string;
    difficulty: string;
    status: string;
    problem_statement: string;
    solution_approach: string;
    solution_code: string;
    solution_language: string;
    time_complexity: string;
    space_complexity: string;
    special_notes: string;
    is_important: number;
    is_deleted: number;
    tags: string;
    created_at: string;
    updated_at: string;
  }[];
}

const now = new Date().toISOString();

export const INITIAL_SEED: SeedData = {
  branches: [
    // Main branches
    { id: 'b_arrays', parent_id: null, name: 'Arrays', order_index: 0, is_starred: 1, is_deleted: 0, created_at: now, updated_at: now },
    { id: 'b_two_ptr', parent_id: 'b_arrays', name: 'Two Pointer', order_index: 0, is_starred: 0, is_deleted: 0, created_at: now, updated_at: now },
    { id: 'b_sliding_win', parent_id: 'b_arrays', name: 'Sliding Window', order_index: 1, is_starred: 1, is_deleted: 0, created_at: now, updated_at: now },
    { id: 'b_prefix_sum', parent_id: 'b_arrays', name: 'Prefix Sum', order_index: 2, is_starred: 0, is_deleted: 0, created_at: now, updated_at: now },

    { id: 'b_stack', parent_id: null, name: 'Stack', order_index: 1, is_starred: 0, is_deleted: 0, created_at: now, updated_at: now },
    { id: 'b_greedy', parent_id: null, name: 'Greedy', order_index: 2, is_starred: 0, is_deleted: 0, created_at: now, updated_at: now },
    { id: 'b_linked_list', parent_id: null, name: 'Linked List', order_index: 3, is_starred: 1, is_deleted: 0, created_at: now, updated_at: now },
    { id: 'b_dp', parent_id: null, name: 'Dynamic Programming', order_index: 4, is_starred: 0, is_deleted: 0, created_at: now, updated_at: now },
    { id: 'b_graph', parent_id: null, name: 'Graph', order_index: 5, is_starred: 0, is_deleted: 0, created_at: now, updated_at: now },
  ],
  questions: [
    // Two Pointer: Two Sum
    {
      id: 'q_two_sum',
      branch_id: 'b_two_ptr',
      title: 'Two Sum',
      url: 'https://leetcode.com/problems/two-sum/',
      difficulty: 'Easy',
      status: 'solved',
      problem_statement: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
      solution_approach: `### Optimal Approach: Hash Map (Single Pass)
1. Maintain a hash map storing the number as the key and its index as the value.
2. For each number \`nums[i]\`, calculate \`complement = target - nums[i]\`.
3. If \`complement\` already exists in the map, return \`[map[complement], i]\`.
4. Otherwise, insert \`nums[i]\` into the hash map and continue.`,
      solution_code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> numMap;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (numMap.find(complement) != numMap.end()) {
                return {numMap[complement], i};
            }
            numMap[nums[i]] = i;
        }
        return {};
    }
};`,
      solution_language: 'cpp',
      time_complexity: 'O(n)',
      space_complexity: 'O(n)',
      special_notes: `- Key intuition: Trade space for time using a hash map lookup in O(1).
- Watch out for duplicates: they get overwritten, but since we check the complement *before* adding the current element, it works correctly.
- Common follow-up: If the array is sorted, use two pointers from left and right with O(1) space.`,
      is_important: 1,
      is_deleted: 0,
      tags: JSON.stringify(['Array', 'HashMap', 'Easy', 'Two Pointer']),
      created_at: now,
      updated_at: now
    },

    // Two Pointer: 3Sum
    {
      id: 'q_3sum',
      branch_id: 'b_two_ptr',
      title: '3Sum',
      url: 'https://leetcode.com/problems/3sum/',
      difficulty: 'Medium',
      status: 'in_progress',
      problem_statement: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
      solution_approach: `### Two Pointers with Sorting:
1. Sort the array in ascending order.
2. Iterate index \`i\` from 0 to \`n - 3\`.
3. If \`nums[i] > 0\`, break early because further numbers cannot sum to 0.
4. Skip duplicate elements for \`i\`.
5. Use two pointers \`left = i + 1\` and \`right = n - 1\` to find pairs where \`nums[left] + nums[right] == -nums[i]\`.
6. When a valid triplet is found, increment \`left\` and decrement \`right\` while skipping consecutive duplicates.`,
      solution_code: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        vector<vector<int>> result;
        sort(nums.begin(), nums.end());
        int n = nums.size();

        for (int i = 0; i < n - 2; ++i) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            if (nums[i] > 0) break;

            int left = i + 1, right = n - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    result.push_back({nums[i], nums[left], nums[right]});
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return result;
    }
};`,
      solution_language: 'cpp',
      time_complexity: 'O(n²)',
      space_complexity: 'O(1) extra space (ignoring output)',
      special_notes: `- Crucial step: Skipping duplicate elements at all three pointers (\`i\`, \`left\`, and \`right\`) prevents duplicate triplets in the output without needing a Set.
- Sorting takes O(n log n), which is dominated by the O(n²) nested loop.`,
      is_important: 1,
      is_deleted: 0,
      tags: JSON.stringify(['Array', 'Two Pointer', 'Sorting', 'Medium']),
      created_at: now,
      updated_at: now
    },

    // Two Pointer: Container With Most Water
    {
      id: 'q_container_water',
      branch_id: 'b_two_ptr',
      title: 'Container With Most Water',
      url: 'https://leetcode.com/problems/container-with-most-water/',
      difficulty: 'Medium',
      status: 'solved',
      problem_statement: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.`,
      solution_approach: `### Two Pointers Greedy Approach:
1. Place one pointer at the beginning (\`left = 0\`) and one at the end (\`right = n - 1\`).
2. Current area is \`min(height[left], height[right]) * (right - left)\`.
3. Always move the pointer pointing to the shorter line inward, since keeping the shorter line cannot produce a larger area as the width shrinks.`,
      solution_code: `class Solution {
public:
    int maxArea(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int maxWater = 0;

        while (left < right) {
            int h = min(height[left], height[right]);
            maxWater = max(maxWater, h * (right - left));
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return maxWater;
    }
};`,
      solution_language: 'cpp',
      time_complexity: 'O(n)',
      space_complexity: 'O(1)',
      special_notes: `- Proof of correctness: Moving the taller line can never yield a greater area because height is limited by the shorter line and width strictly decreases.`,
      is_important: 0,
      is_deleted: 0,
      tags: JSON.stringify(['Array', 'Two Pointer', 'Greedy', 'Medium']),
      created_at: now,
      updated_at: now
    },

    // Sliding Window: Longest Substring Without Repeating Characters
    {
      id: 'q_longest_substring',
      branch_id: 'b_sliding_win',
      title: 'Longest Substring Without Repeating Characters',
      url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      difficulty: 'Medium',
      status: 'solved',
      problem_statement: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

### Example:
\`\`\`
Input: s = "abcabcbb"
Output: 3 ("abc")
\`\`\``,
      solution_approach: `### Sliding Window with Character Map:
1. Use two pointers \`left\` and \`right\` to define the current window.
2. Keep a map/array of the last seen index for each character.
3. When character at \`right\` is encountered and its last seen index is \`>= left\`, advance \`left = lastSeen[c] + 1\`.
4. Update max length as \`right - left + 1\`.`,
      solution_code: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> lastPos(128, -1);
        int maxLen = 0, left = 0;

        for (int right = 0; right < s.length(); ++right) {
            char c = s[right];
            if (lastPos[c] >= left) {
                left = lastPos[c] + 1;
            }
            lastPos[c] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      solution_language: 'cpp',
      time_complexity: 'O(n)',
      space_complexity: 'O(1) (fixed 128 ASCII table)',
      special_notes: `- Fixed array of size 128 is much faster than an \`unordered_map\`.
- Remember to only jump \`left\` if the previously seen occurrence is within the current window (\`lastPos[c] >= left\`).`,
      is_important: 1,
      is_deleted: 0,
      tags: JSON.stringify(['String', 'Sliding Window', 'HashMap', 'Medium']),
      created_at: now,
      updated_at: now
    },

    // Stack: Next Greater Element
    {
      id: 'q_next_greater_elem',
      branch_id: 'b_stack',
      title: 'Next Greater Element I',
      url: 'https://leetcode.com/problems/next-greater-element-i/',
      difficulty: 'Easy',
      status: 'solved',
      problem_statement: `The **next greater element** of some element \`x\` in an array is the first greater element that is to the right of \`x\` in the same array.

Given two distinct 0-indexed integer arrays \`nums1\` and \`nums2\`, where \`nums1\` is a subset of \`nums2\`, return an array \`ans\` of length \`nums1.length\` such that \`ans[i]\` is the next greater element for \`nums1[i]\`.`,
      solution_approach: `### Monotonic Decreasing Stack:
1. Traverse \`nums2\` from left to right.
2. While stack is not empty and current element is greater than stack top, pop from stack and map top element's next greater element to the current element.
3. Push current element onto the stack.
4. For remaining elements in stack, their next greater element is -1.
5. Map results for \`nums1\`.`,
      solution_code: `class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nge;
        stack<int> st;

        for (int num : nums2) {
            while (!st.empty() && st.top() < num) {
                nge[st.top()] = num;
                st.pop();
            }
            st.push(num);
        }

        vector<int> res;
        for (int num : nums1) {
            res.push_back(nge.count(num) ? nge[num] : -1);
        }
        return res;
    }
};`,
      solution_language: 'cpp',
      time_complexity: 'O(n + m)',
      space_complexity: 'O(m)',
      special_notes: `- Monotonic stack pattern: whenever we need the *next greater/smaller* element, think Monotonic Stack!
- Each element is pushed and popped at most once.`,
      is_important: 1,
      is_deleted: 0,
      tags: JSON.stringify(['Stack', 'Monotonic Stack', 'Array', 'Easy']),
      created_at: now,
      updated_at: now
    },

    // Linked List: Reverse Linked List
    {
      id: 'q_reverse_ll',
      branch_id: 'b_linked_list',
      title: 'Reverse Linked List',
      url: 'https://leetcode.com/problems/reverse-linked-list/',
      difficulty: 'Easy',
      status: 'solved',
      problem_statement: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.`,
      solution_approach: `### Iterative 3-Pointer Technique:
1. Initialize \`prev = nullptr\`, \`curr = head\`.
2. While \`curr != nullptr\`:
   - Store \`nextTemp = curr->next\`
   - Reverse link: \`curr->next = prev\`
   - Move forward: \`prev = curr\`, \`curr = nextTemp\`
3. Return \`prev\` as new head.`,
      solution_code: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;

        while (curr != nullptr) {
            ListNode* nextTemp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
};`,
      solution_language: 'cpp',
      time_complexity: 'O(n)',
      space_complexity: 'O(1)',
      special_notes: `- Classic building block for many complex linked list problems (Palindrome Linked List, Reorder List, Reverse Nodes in k-Group).`,
      is_important: 1,
      is_deleted: 0,
      tags: JSON.stringify(['Linked List', 'Easy', 'Two Pointer']),
      created_at: now,
      updated_at: now
    },

    // Greedy: Activity Selection / Job Sequencing
    {
      id: 'q_activity_selection',
      branch_id: 'b_greedy',
      title: 'Activity Selection Problem',
      url: 'https://practice.geeksforgeeks.org/problems/activity-selection-1587115620/1',
      difficulty: 'Medium',
      status: 'need_revision',
      problem_statement: `Given \`N\` activities with their start and finish times. Select the maximum number of activities that can be performed by a single person, assuming that a person can only work on a single activity at a time.`,
      solution_approach: `### Greedy Choice: Earliest Finish Time:
1. Sort all activities by their finish times in ascending order.
2. Select the first activity.
3. For subsequent activities, if its start time >= finish time of the last selected activity, select it.`,
      solution_code: `struct Activity {
    int start, finish;
};

bool cmp(Activity a, Activity b) {
    return a.finish < b.finish;
}

int maxActivities(vector<Activity>& acts) {
    sort(acts.begin(), acts.end(), cmp);
    int count = 1;
    int lastFinish = acts[0].finish;

    for (int i = 1; i < acts.size(); i++) {
        if (acts[i].start >= lastFinish) {
            count++;
            lastFinish = acts[i].finish;
        }
    }
    return count;
}`,
      solution_language: 'cpp',
      time_complexity: 'O(n log n)',
      space_complexity: 'O(1)',
      special_notes: `- Greedy choice property holds because picking the activity with the earliest finish time leaves the maximum remaining time for remaining activities.`,
      is_important: 0,
      is_deleted: 0,
      tags: JSON.stringify(['Greedy', 'Sorting', 'Intervals']),
      created_at: now,
      updated_at: now
    }
  ]
};
