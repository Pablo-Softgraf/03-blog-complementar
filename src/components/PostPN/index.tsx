import { GetStaticPaths, GetStaticProps } from 'next';
import React from 'react';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import styles from './postpn.module.scss';
import { useRouter } from 'next/router';

import Link from 'next/link';

interface PostPN {
    nextId: string;
}

interface PostPNProps {
    postpn: PostPN;
}

export default function PostPN({ postpn }: PostPNProps) {

    //const router = useRouter();

    return (
        <>
            <div className={styles.postPrevPost}>
                <span>
                    Como Utilizar Hooks
                        <a>
                        Post Anterior
                    </a>
                </span>
                <span>
                    Criando um app CRA do Zero
                    <p>Próximo Post{postpn.nextId}</p>
                </span>
            </div>
        </>
    )
}


export const getStaticPaths: GetStaticPaths = async () => {
    const prismic = getPrismicClient();

    const posts = await prismic.query(
        [Prismic.predicates.at('document.type', 'post')],
        {
            pageSize: 2,
        }
    );

    // Get the paths we want to pre-render based on posts
    const paths = posts.results.map(post => ({
        params: { slug: post.uid },
    }));
    return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async context => {
    const prismic = getPrismicClient();

    const response = await prismic.query([
        Prismic.predicates.at('document.type', 'post')
    ], {
        fetch: ['post.title', 'post.subtitle', 'post.author'],
        after: 'YHoEdRMAAPkNusxk'
    })

    return {
        props:
        {
            nextId: response.results
        }
    }


};
