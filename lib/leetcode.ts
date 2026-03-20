"use server";

import { Problem, Topic } from "./types";

const LEETCODE_GQL_URL = "https://leetcode.com/graphql/";

export interface LeetCodeUserStats {
  username: string;
  realName: string;
  solvedCount: number;
  totalQuestions: number;
  recentSubmissions: {
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }[];
}

export async function fetchLeetCodeStats(sessionCookie: string): Promise<LeetCodeUserStats | null> {
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      recentSubmissionList(username: $username, limit: 10) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `;

  // Note: To get the username, we first need to call a "session" query if not provided,
  // but usually we ask the user for their username + cookie.
  // This is a simplified version.
  
  try {
    // 1. Get current user's username from session
    const userQuery = `query { user { username } }`;
    const userRes = await fetch(LEETCODE_GQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `LEETCODE_SESSION=${sessionCookie}`,
      },
      body: JSON.stringify({ query: userQuery }),
    });
    const userData = await userRes.json();
    const username = userData.data?.user?.username;

    if (!username) return null;

    // 2. Get stats
    const statsRes = await fetch(LEETCODE_GQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `LEETCODE_SESSION=${sessionCookie}`,
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    const statsData = await statsRes.json();
    const user = statsData.data.matchedUser;

    return {
      username: user.username,
      realName: user.profile.realName,
      solvedCount: user.submitStats.acSubmissionNum.find((s: any) => s.difficulty === "All")?.count || 0,
      totalQuestions: 3000, // Roughly
      recentSubmissions: statsData.data.recentSubmissionList,
    };
  } catch (err) {
    console.error("LeetCode fetch error:", err);
    return null;
  }
}

export async function fetchAllLeetCodeProblems(limit = 50, skip = 0) {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          acRate
          difficulty
          title
          titleSlug
          topicTags {
            name
            slug
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(LEETCODE_GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          categorySlug: "",
          skip,
          limit,
          filters: {},
        },
      }),
    });

    const body = await res.json();
    return body.data.problemsetQuestionList;
  } catch (err) {
    console.error("Fetch problems error:", err);
    return null;
  }
}
