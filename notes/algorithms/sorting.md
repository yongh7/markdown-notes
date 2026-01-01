# Sorting Algorithms

This note covers fundamental sorting algorithms.

## Bubble Sort

Bubble sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.

**Time Complexity**: $O(n^2)$

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
```

## Quick Sort

Quick sort is a divide-and-conquer algorithm. It picks an element as pivot and partitions the array around it.

**Time Complexity**: $O(n \log n)$ average case

## Merge Sort

Merge sort divides the array into two halves, recursively sorts them, and then merges the sorted halves.

**Recurrence Relation**:

$$T(n) = 2T(n/2) + O(n)$$
