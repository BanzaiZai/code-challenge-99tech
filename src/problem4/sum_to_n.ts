// Time: Always the same regardless of input size
// Space: Constant, minimal memory usage
// Most efficient approach using Gauss formula - just does a few math operations once
function sum_to_n_a(n: number): number {
  return n * (n + 1) / 2
}

// Time: Increases linearly with input size - if input doubles, time doubles
// Space: Constant, minimal memory usage
// Iterative approach - must visit each number once in a loop
function sum_to_n_b(n: number): number {
  let sum = 0
  for (let i = 1; i <= n; i++) {
    sum += i
  }
  return sum
}

// Time: Increases linearly with input size - if input doubles, time doubles
// Space: Increases linearly with input size - each recursive call uses memory on the stack
// Recursive approach - elegant but uses more memory due to call stack overhead
function sum_to_n_c(n: number): number {
  if (n <= 1) return 1
  return n + sum_to_n_c(n - 1)
}
