import { Problem } from "./types";

export const problems: Problem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topics: ["arrays"],
    lc_url: "https://leetcode.com/problems/two-sum/",
    description:
      "Given an array of integers and a target value, find two numbers that add up to the target. Return the indices of those two numbers. There is exactly one solution for each input.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # your code here
    pass`,
      javascript: `function twoSum(nums, target) {
    // your code here
}`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // your code here
        return new int[]{};
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // your code here
        return {};
    }
};`,
    },
    coach_context:
      "Optimal approach uses a hash map for O(n) time. Common mistake: nested loop brute force at O(n^2). Key insight is storing complements (target - current) as you iterate. Watch for off-by-one with returning indices vs values.",
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topics: ["stacks"],
    lc_url: "https://leetcode.com/problems/valid-parentheses/",
    description:
      "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string has valid (properly nested and matched) brackets.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `def isValid(s: str) -> bool:
    # your code here
    pass`,
      javascript: `function isValid(s) {
    // your code here
}`,
      java: `class Solution {
    public boolean isValid(String s) {
        // your code here
        return false;
    }
}`,
      cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // your code here
        return false;
    }
};`,
    },
    coach_context:
      "Classic stack problem. Push opening brackets, pop and match on closing brackets. Common mistakes: forgetting to check stack is empty at the end, not handling edge case where string starts with a closing bracket. O(n) time, O(n) space.",
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    topics: ["binary-search"],
    lc_url: "https://leetcode.com/problems/binary-search/",
    description:
      "Given a sorted array of integers and a target value, return the index of the target if found. If not found, return -1. The array has distinct values.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `def search(nums: list[int], target: int) -> int:
    # your code here
    pass`,
      javascript: `function search(nums, target) {
    // your code here
}`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        // your code here
        return -1;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // your code here
        return -1;
    }
};`,
    },
    coach_context:
      "Textbook binary search. Key decisions: inclusive vs exclusive bounds, mid calculation (avoid overflow with lo + (hi - lo) / 2). Common mistake: off-by-one errors causing infinite loops. O(log n) time, O(1) space.",
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topics: ["arrays"],
    lc_url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    description:
      "Given an array where each element represents a stock price on that day, find the maximum profit from a single buy and sell. You must buy before you sell. Return 0 if no profit is possible.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `def maxProfit(prices: list[int]) -> int:
    # your code here
    pass`,
      javascript: `function maxProfit(prices) {
    // your code here
}`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        // your code here
        return 0;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // your code here
        return 0;
    }
};`,
    },
    coach_context:
      "Track minimum price seen so far, compute profit at each step. Common mistake: trying to use two-pointer or sorting (destroys temporal order). Key insight: only need one pass, tracking running min. O(n) time, O(1) space.",
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    topics: ["sliding-window"],
    lc_url: "https://leetcode.com/problems/maximum-subarray/",
    description:
      "Find the contiguous subarray within an array of integers that has the largest sum. Return that sum.",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
    starter_code: {
      python: `def maxSubArray(nums: list[int]) -> int:
    # your code here
    pass`,
      javascript: `function maxSubArray(nums) {
    // your code here
}`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // your code here
        return 0;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // your code here
        return 0;
    }
};`,
    },
    coach_context:
      "Kadane's algorithm: maintain current sum, reset to 0 when it goes negative. Common mistake: initializing max to 0 instead of negative infinity (fails for all-negative arrays). O(n) time, O(1) space. Follow-up: divide and conquer approach at O(n log n).",
  },
  {
    slug: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    topics: ["graphs"],
    lc_url: "https://leetcode.com/problems/number-of-islands/",
    description:
      "Given a 2D grid of '1's (land) and '0's (water), count the number of distinct islands. An island is formed by connecting adjacent lands horizontally or vertically.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `def numIslands(grid: list[list[str]]) -> int:
    # your code here
    pass`,
      javascript: `function numIslands(grid) {
    // your code here
}`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        // your code here
        return 0;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // your code here
        return 0;
    }
};`,
    },
    coach_context:
      "BFS or DFS from each unvisited '1', marking visited cells. Count how many times you start a new traversal. Common mistakes: forgetting to mark cells as visited (infinite loop), not handling grid boundaries. O(m*n) time and space.",
  },
  {
    slug: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    topics: ["dynamic-programming"],
    lc_url: "https://leetcode.com/problems/coin-change/",
    description:
      "Given coin denominations and a target amount, find the minimum number of coins needed to make that amount. If it is not possible, return -1. You have infinite coins of each denomination.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `def coinChange(coins: list[int], amount: int) -> int:
    # your code here
    pass`,
      javascript: `function coinChange(coins, amount) {
    // your code here
}`,
      java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        // your code here
        return -1;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // your code here
        return -1;
    }
};`,
    },
    coach_context:
      "Bottom-up DP: dp[i] = min coins to make amount i. Fill from 1 to amount. For each amount, try each coin. Common mistake: greedy approach (fails for coins like [1,3,4] amount=6). O(amount * coins) time, O(amount) space.",
  },
  {
    slug: "lru-cache",
    title: "LRU Cache",
    difficulty: "Hard",
    topics: ["heaps"],
    lc_url: "https://leetcode.com/problems/lru-cache/",
    description:
      "Design a data structure that implements a Least Recently Used cache with O(1) get and put operations. When the cache exceeds capacity, evict the least recently used item.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        # your code here
        pass

    def get(self, key: int) -> int:
        # your code here
        pass

    def put(self, key: int, value: int) -> None:
        # your code here
        pass`,
      javascript: `class LRUCache {
    constructor(capacity) {
        // your code here
    }

    get(key) {
        // your code here
    }

    put(key, value) {
        // your code here
    }
}`,
      java: `class LRUCache {
    public LRUCache(int capacity) {
        // your code here
    }

    public int get(int key) {
        // your code here
        return -1;
    }

    public void put(int key, int value) {
        // your code here
    }
}`,
      cpp: `#include <unordered_map>
using namespace std;

class LRUCache {
public:
    LRUCache(int capacity) {
        
    }
    
    int get(int key) {
        return -1;
    }
    
    void put(int key, int value) {
        
    }
};`,
    },
    coach_context:
      "Doubly linked list + hash map. Hash map gives O(1) lookup, linked list gives O(1) insert/remove for ordering. Common mistake: only using one data structure (can't get O(1) for both ops). Key insight: sentinel head/tail nodes simplify edge cases dramatically.",
  },
  {
    slug: "word-search",
    title: "Word Search",
    difficulty: "Medium",
    topics: ["backtracking"],
    lc_url: "https://leetcode.com/problems/word-search/",
    description:
      "Given a 2D board of characters and a target word, determine if the word exists in the grid. The word can be constructed from sequentially adjacent cells (horizontal or vertical), and each cell may only be used once.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `def exist(board: list[list[str]], word: str) -> bool:
    # your code here
    pass`,
      javascript: `function exist(board, word) {
    // your code here
}`,
      java: `class Solution {
    public boolean exist(char[][] board, String word) {
        // your code here
        return false;
    }
}`,
      cpp: `#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    bool exist(vector<vector<char>>& board, string word) {
        // your code here
        return false;
    }
};`,
    },
    coach_context:
      "Backtracking DFS from each cell. Mark cells as visited during recursion, unmark on backtrack. Common mistakes: not restoring the board state when backtracking, checking bounds after accessing (index out of range). Pruning: check if remaining board has enough characters. O(m*n*4^L) worst case.",
  },
  {
    slug: "implement-trie",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "Medium",
    topics: ["tries"],
    lc_url: "https://leetcode.com/problems/implement-trie-prefix-tree/",
    description:
      "Implement a trie that supports inserting words, searching for exact matches, and checking if any previously inserted word starts with a given prefix.",
    examples: [],
    constraints: [],
    starter_code: {
      python: `class Trie:
    def __init__(self):
        # your code here
        pass

    def insert(self, word: str) -> None:
        # your code here
        pass

    def search(self, word: str) -> bool:
        # your code here
        pass

    def startsWith(self, prefix: str) -> bool:
        # your code here
        pass`,
      javascript: `class Trie {
    constructor() {
        // your code here
    }

    insert(word) {
        // your code here
    }

    search(word) {
        // your code here
    }

    startsWith(prefix) {
        // your code here
    }
}`,
      java: `class Trie {
    public Trie() {
        // your code here
    }

    public void insert(String word) {
        // your code here
    }

    public boolean search(String word) {
        // your code here
        return false;
    }

    public boolean startsWith(String prefix) {
        // your code here
        return false;
    }
}`,
      cpp: `#include <string>
using namespace std;

class Trie {
public:
    Trie() {
        
    }
    
    void insert(string word) {
        
    }
    
    bool search(string word) {
        return false;
    }
    
    bool startsWith(string prefix) {
        return false;
    }
};`,
    },
    coach_context:
      "Each node has a map of children (char -> node) and an isEnd flag. Insert: walk/create nodes per character. Search vs startsWith: only difference is checking isEnd at the terminal node. Common mistake: confusing the two. O(L) for all operations where L = word length.",
  },
  {
    slug: "assign-cookies",
    title: "Assign Cookies",
    difficulty: "Easy",
    topics: ["arrays"],
    lc_url: "https://leetcode.com/problems/assign-cookies/",
    description:
      "Assume you are an awesome parent and want to give your children some cookies. But, you should give each child at most one cookie.\\n\\nEach child i has a greed factor g[i], which is the minimum size of a cookie that the child will be content with; and each cookie j has a size s[j]. If s[j] >= g[i], we can assign the cookie j to the child i, and the child i will be content. Your goal is to maximize the number of your content children and output the maximum number.",
    examples: [
      {
        input: "g = [1,2,3], s = [1,1]",
        output: "1",
        explanation: "You have 3 children and 2 cookies. The greed factors of 3 children are 1, 2, 3. Even though you have 2 cookies, since their size is both 1, you could only make the child whose greed factor is 1 content.",
      },
      {
        input: "g = [1,2], s = [1,2,3]",
        output: "2",
        explanation: "You have 2 children and 3 cookies. The greed factors of 2 children are 1, 2. You have 3 cookies and their sizes are big enough to gratify all of the children. You need to output 2.",
      },
    ],
    constraints: [
      "1 <= g.length <= 3 * 10^4",
      "0 <= s.length <= 3 * 10^4",
      "1 <= g[i], s[j] <= 2^31 - 1",
    ],
    starter_code: {
      python: `def findContentChildren(g: list[int], s: list[int]) -> int:
    # your code here
    pass`,
      javascript: `function findContentChildren(g, s) {
    // your code here
}`,
      java: `class Solution {
    public int findContentChildren(int[] g, int[] s) {
        // your code here
        return 0;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        // your code here
        return 0;
    }
};`,
    },
    coach_context:
      "Sorting + Two-pointer greedy approach. Sort both greed and cookie size arrays. Use two pointers to iterate. If the current cookie satisfies the current child, increment both. Otherwise, try the next larger cookie for the same child. O(n log n) due to sorting.",
  },
];

export function getProblemBySlug(slug: string): Problem | undefined {
  return problems.find((p) => p.slug === slug);
}

export function getTopics(): string[] {
  const all = new Set<string>();
  problems.forEach((p) => p.topics.forEach((t) => all.add(t)));
  return Array.from(all).sort();
}
