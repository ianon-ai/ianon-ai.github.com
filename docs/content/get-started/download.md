1. step one
2. step 2

```html
<head>
  <meta charset="UTF">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
```

```js
  // Add active class to current item
  const activeItem = document.querySelector(`[data-path="${path}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
```

* test1
* test2
* test3

- test4
- test5
- test6


> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.